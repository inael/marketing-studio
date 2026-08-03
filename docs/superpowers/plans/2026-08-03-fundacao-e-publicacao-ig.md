# Marketing Studio — Fundação + Publicação IG (piloto) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Next.js (Logto) com schema Supabase (brands/posts/media/logs), semeado com a marca IT Booster, capaz de publicar um post (imagem única ou carrossel) no @itboosterglobal via Graph API oficial, a partir de uma GUI mínima (listar/criar/aprovar/publicar).

**Architecture:** Next.js 15 (App Router, TS) serve GUI + API routes. Auth por Logto. Dados no Supabase Postgres self-hosted acessado por postgres.js em código server-only. Mídia sobe pro Cloudflare R2 (URL pública exigida pela Graph API). A publicação IG é um port em TypeScript do fluxo comprovado do `integracoes/instagram/lib/ig_graph.py` (cria container → espera FINISHED → publica → pega permalink). Sem worker Python neste slice (fica pra quando precisar render pesado).

**Tech Stack:** Next.js 15, TypeScript, Tailwind + shadcn/ui, postgres.js, `@logto/next`, `@aws-sdk/client-s3` (R2), vitest.

## Global Constraints

- Auth = **Logto** (padrão IT Booster). Não usar Supabase Auth.
- Logto é fachada: `LOGTO_ENDPOINT=https://auth.midiaplay.net` (já configurado + cert no ar). O **issuer** do OIDC volta como `https://auth.itbooster.com.br/oidc` (fixo na instância, 1 Logto p/ N domínios). NÃO forçar/validar issuer casado com o endpoint (gotcha; ver reference_logto_issuer_vs_endpoint). Redirect URI no app Logto: `https://midiaplay.net/logto/callback`.
- Publicação só de post com `status = approved` (revisão humana obrigatória). Fluxo: `draft → approved → scheduled → published | failed`.
- Mídia da Graph API tem que estar em **URL pública** (R2). Nunca passar caminho local.
- Reusar o fluxo comprovado da Graph API (v21.0): 1 imagem = post simples; 2+ = carrossel (`is_carousel_item` nos filhos + `media_type=CAROUSEL` no pai).
- Credenciais só via env (nunca commitar): `DATABASE_URL`, `LOGTO_*`, R2 (`R2_*`), `META_ITBOOSTER_IG_USER_ID`, `META_ITBOOSTER_ACCESS_TOKEN` (já no vault).
- Git: commit `--author="inael <inael.rodrigues@gmail.com>"`. Sem em-dash em texto de UI/copy.
- Todo código server-only que toca DB/tokens fica sob `src/server/**` e nunca é importado por client component.

---

## File Structure

- `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example` — scaffold.
- `db/migrations/0001_init.sql` — schema (brands, posts, media_assets, publish_logs).
- `db/seed_itbooster.sql` — seed da marca piloto.
- `scripts/migrate.mjs` — aplica migrations + seed (postgres.js).
- `src/server/db.ts` — client postgres.js singleton (server-only).
- `src/server/brands.ts` — `getBrand(slug)`, `listBrands()`.
- `src/server/posts.ts` — `getPost(id)`, `listPosts(brandId?)`, `createPost(input)`, `setPostStatus(id, status, patch)`.
- `src/server/graph.ts` — port TS do ig_graph: `publishImages(account, urls, caption)`.
- `src/server/r2.ts` — `uploadPublic(localOrBuffer, key)` → URL pública.
- `src/server/publish.ts` — `publishPost(postId)` orquestra media→graph→logs→status.
- `src/lib/caption.ts` — `formatCaption(text, hashtags)` (puro, testável).
- `src/app/api/posts/[id]/publish/route.ts` — POST endpoint (auth Logto + chama publishPost).
- `src/app/(app)/posts/page.tsx` — lista de posts + ações.
- `src/app/logto/[...logto]/route.ts` + `src/app/api/logto/*` — rotas Logto.
- Testes: `src/lib/caption.test.ts`, `src/server/graph.test.ts`, `src/server/r2.test.ts`, `src/server/publish.test.ts`.

---

### Task 1: Scaffold do app + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.gitignore` (já existe, ajustar), `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`

**Interfaces:**
- Produces: projeto Next.js 15 + TS que roda `npm run dev`, `npm run build`, `npm run test`.

- [ ] **Step 1: Criar o app**

```bash
cd /c/Users/inael-pc/Documents/GitHub/marketing-studio
npx create-next-app@latest app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
# mover conteudo de app/ pra raiz OU trabalhar dentro de app/. Decisao: raiz do repo.
```
Nota pro implementador: o repo já tem `docs/` e `projetos_para_estudo/` (git-ignored). Rode o create-next-app numa pasta temporária e mova os arquivos gerados pra raiz, preservando `docs/`, `.itbooster-meta.yaml`, `README.md`.

- [ ] **Step 2: Adicionar deps do projeto**

```bash
npm i postgres @logto/next @aws-sdk/client-s3
npm i -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
```

- [ ] **Step 4: Script de teste + `.env.example`**

Em `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"db:migrate": "node scripts/migrate.mjs"`.
`.env.example`:
```
DATABASE_URL=postgres://user:pass@host:5432/marketing_studio
LOGTO_ENDPOINT=https://auth.midiaplay.net
LOGTO_APP_ID=
LOGTO_APP_SECRET=
LOGTO_COOKIE_SECRET=
LOGTO_BASE_URL=https://midiaplay.net
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE=
META_ITBOOSTER_IG_USER_ID=
META_ITBOOSTER_ACCESS_TOKEN=
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: build passa (página inicial default).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit --author="inael <inael.rodrigues@gmail.com>" -m "chore: scaffold Next.js 15 + TS + vitest"
```

---

### Task 2: `formatCaption` (unidade pura, TDD)

**Files:**
- Create: `src/lib/caption.ts`, `src/lib/caption.test.ts`

**Interfaces:**
- Produces: `formatCaption(text: string, hashtags?: string[]): string` — junta legenda + hashtags (uma `#` por tag, sem duplicar `#`, separadas por espaço, precedidas de duas quebras de linha). Usado por `publish.ts`.

- [ ] **Step 1: Teste que falha**

```ts
import { describe, it, expect } from "vitest";
import { formatCaption } from "./caption";

describe("formatCaption", () => {
  it("sem hashtags retorna o texto", () => {
    expect(formatCaption("oi")).toBe("oi");
  });
  it("adiciona hashtags normalizando o #", () => {
    expect(formatCaption("oi", ["a", "#b"])).toBe("oi\n\n#a #b");
  });
  it("ignora hashtags vazias", () => {
    expect(formatCaption("oi", ["", " ", "x"])).toBe("oi\n\n#x");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/caption.test.ts`
Expected: FAIL ("Cannot find module './caption'").

- [ ] **Step 3: Implementar**

```ts
export function formatCaption(text: string, hashtags: string[] = []): string {
  const tags = hashtags
    .map((t) => t.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((t) => `#${t}`);
  return tags.length ? `${text}\n\n${tags.join(" ")}` : text;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/caption.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/caption.ts src/lib/caption.test.ts && git commit --author="inael <inael.rodrigues@gmail.com>" -m "feat: formatCaption"
```

---

### Task 3: Motor de publicação Graph API em TS (TDD com fetch mockado)

**Files:**
- Create: `src/server/graph.ts`, `src/server/graph.test.ts`

**Interfaces:**
- Consumes: `fetch` global.
- Produces:
  - `type IgAccount = { igUserId: string; token: string }`
  - `publishImages(acc: IgAccount, imageUrls: string[], caption: string): Promise<{ mediaId: string; permalink: string | null }>`
  - Internamente: `graphCall`, `waitReady`, `publishSingle`, `publishCarousel`.

- [ ] **Step 1: Teste que falha**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishImages } from "./graph";

const acc = { igUserId: "IG1", token: "T" };

function mockFetchSequence(responses: any[]) {
  const f = vi.fn();
  responses.forEach((r) => f.mockResolvedValueOnce({ ok: true, status: 200, json: async () => r, text: async () => JSON.stringify(r) }));
  globalThis.fetch = f as any;
  return f;
}

describe("publishImages", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("1 imagem = post simples e retorna permalink", async () => {
    const f = mockFetchSequence([
      { id: "CONT1" },                        // POST /IG1/media
      { status_code: "FINISHED" },            // GET container
      { id: "MEDIA1" },                       // POST /IG1/media_publish
      { permalink: "https://insta/p/x" },     // GET permalink
    ]);
    const r = await publishImages(acc, ["https://img/1.jpg"], "cap");
    expect(r.mediaId).toBe("MEDIA1");
    expect(r.permalink).toBe("https://insta/p/x");
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("2+ imagens = carrossel", async () => {
    mockFetchSequence([
      { id: "C1" }, { id: "C2" },             // filhos
      { id: "PARENT" },                       // pai CAROUSEL
      { status_code: "FINISHED" },            // GET container pai
      { id: "MEDIA2" },                       // media_publish
      { permalink: "https://insta/p/y" },
    ]);
    const r = await publishImages(acc, ["a", "b"], "cap");
    expect(r.mediaId).toBe("MEDIA2");
  });

  it("lança em erro HTTP", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "bad" }) as any;
    await expect(publishImages(acc, ["a"], "c")).rejects.toThrow(/Graph API 400/);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/server/graph.test.ts`
Expected: FAIL ("Cannot find module './graph'").

- [ ] **Step 3: Implementar (port do ig_graph.py)**

```ts
const GRAPH = "https://graph.facebook.com/v21.0";
export type IgAccount = { igUserId: string; token: string };

async function graphCall(token: string, method: "GET" | "POST", path: string, params: Record<string, string>) {
  const usp = new URLSearchParams({ ...params, access_token: token });
  const url = method === "GET" ? `${GRAPH}/${path}?${usp}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method: "POST", body: usp });
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function waitReady(token: string, containerId: string, attempts = 30, sleepMs = 3000) {
  for (let i = 0; i < attempts; i++) {
    const s = await graphCall(token, "GET", containerId, { fields: "status_code" });
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new Error(`container ERROR: ${JSON.stringify(s)}`);
    await new Promise((r) => setTimeout(r, sleepMs));
  }
  throw new Error(`container ${containerId} nao ficou pronto`);
}

async function publishSingle(acc: IgAccount, imageUrl: string, caption: string) {
  const c = await graphCall(acc.token, "POST", `${acc.igUserId}/media`, { image_url: imageUrl, caption });
  await waitReady(acc.token, c.id, 20);
  const r = await graphCall(acc.token, "POST", `${acc.igUserId}/media_publish`, { creation_id: c.id });
  return r.id as string;
}

async function publishCarousel(acc: IgAccount, imageUrls: string[], caption: string) {
  const children: string[] = [];
  for (const u of imageUrls) {
    const c = await graphCall(acc.token, "POST", `${acc.igUserId}/media`, { image_url: u, is_carousel_item: "true" });
    children.push(c.id);
  }
  const parent = await graphCall(acc.token, "POST", `${acc.igUserId}/media`, {
    media_type: "CAROUSEL", children: children.join(","), caption,
  });
  await waitReady(acc.token, parent.id, 30);
  const r = await graphCall(acc.token, "POST", `${acc.igUserId}/media_publish`, { creation_id: parent.id });
  return r.id as string;
}

export async function publishImages(acc: IgAccount, imageUrls: string[], caption: string) {
  if (imageUrls.length === 0) throw new Error("nenhuma imagem");
  const mediaId = imageUrls.length === 1
    ? await publishSingle(acc, imageUrls[0], caption)
    : await publishCarousel(acc, imageUrls, caption);
  let permalink: string | null = null;
  try {
    const info = await graphCall(acc.token, "GET", mediaId, { fields: "permalink" });
    permalink = info.permalink ?? null;
  } catch { /* best-effort */ }
  return { mediaId, permalink };
}
```
Nota: `waitReady` usa `setTimeout`; nos testes o container já volta `FINISHED` na 1ª chamada, então não há espera real.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/server/graph.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/server/graph.ts src/server/graph.test.ts && git commit --author="inael <inael.rodrigues@gmail.com>" -m "feat: motor Graph API IG (port TS do ig_graph)"
```

---

### Task 4: Upload R2 (URL pública) (TDD com S3 client mockado)

**Files:**
- Create: `src/server/r2.ts`, `src/server/r2.test.ts`

**Interfaces:**
- Produces: `uploadPublic(body: Buffer | Uint8Array, key: string, contentType: string): Promise<string>` — sobe no bucket R2 e retorna `${R2_PUBLIC_BASE}/${key}`.

- [ ] **Step 1: Teste que falha**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({});
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({ send: sendMock })),
  PutObjectCommand: vi.fn((input) => ({ input })),
}));

describe("uploadPublic", () => {
  beforeEach(() => { sendMock.mockClear(); process.env.R2_PUBLIC_BASE = "https://cdn.itb/x"; process.env.R2_BUCKET = "b"; });
  it("sobe e retorna URL publica", async () => {
    const { uploadPublic } = await import("./r2");
    const url = await uploadPublic(Buffer.from("x"), "posts/1/a.jpg", "image/jpeg");
    expect(url).toBe("https://cdn.itb/x/posts/1/a.jpg");
    expect(sendMock).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/server/r2.test.ts` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});

export async function uploadPublic(body: Buffer | Uint8Array, key: string, contentType: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
  return `${process.env.R2_PUBLIC_BASE}/${key}`;
}
```

- [ ] **Step 4: Rodar e ver passar** → `npx vitest run src/server/r2.test.ts` = PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/r2.ts src/server/r2.test.ts && git commit --author="inael <inael.rodrigues@gmail.com>" -m "feat: upload R2 URL publica"
```

---

### Task 5: Schema Supabase + client + camada de dados

**Files:**
- Create: `db/migrations/0001_init.sql`, `db/seed_itbooster.sql`, `scripts/migrate.mjs`, `src/server/db.ts`, `src/server/brands.ts`, `src/server/posts.ts`

**Interfaces:**
- Produces:
  - `type Brand = { id, slug, nome, cor_principal, cor_apoio: string[], fonte, tom_voz, ig_user_id, ig_token, site_url, ativo }`
  - `getBrand(slug: string): Promise<Brand | null>`, `listBrands(): Promise<Brand[]>`
  - `type Post = { id, brand_id, tipo, formato, legenda, hashtags: string[], media: string[], scheduled_at, status, external_url }`
  - `getPost(id), listPosts(brandId?), createPost(input), setPostStatus(id, status, patch)`

- [ ] **Step 1: Migration**

`db/migrations/0001_init.sql`:
```sql
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  cor_principal text, cor_apoio text[] default '{}',
  fonte text, tom_voz text,
  ig_user_id text, ig_token text,
  linkedin_org_id text, linkedin_token text,
  site_url text, ativo boolean default true,
  created_at timestamptz default now()
);
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  tipo text not null check (tipo in ('carousel','image','reel')),
  formato text not null check (formato in ('com_personagem','sem_personagem','demo_ui')),
  legenda text default '', hashtags text[] default '{}',
  media text[] default '{}',
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft','approved','scheduled','published','failed')),
  aprovado_por text, aprovado_em timestamptz,
  external_url text, erro text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id), tipo text, url text not null,
  origem text, meta jsonb default '{}', created_at timestamptz default now()
);
create table if not exists publish_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id), rede text, status text,
  external_id text, erro text, ts timestamptz default now()
);
```

`db/seed_itbooster.sql`:
```sql
insert into brands (slug, nome, cor_principal, cor_apoio, fonte, tom_voz, site_url)
values ('itbooster','IT Booster','#9333ea', array['#60a5fa','#020015'], 'Inter',
        'tech, direto, foco em acelerar vendas', 'https://itbooster.com.br')
on conflict (slug) do nothing;
```
Nota: `ig_user_id`/`ig_token` do brand piloto NÃO vão no seed (segredo). São lidos do env em runtime (ver Task 6) OU atualizados via UPDATE manual pós-deploy.

- [ ] **Step 2: `scripts/migrate.mjs`**

```js
import postgres from "postgres";
import { readFileSync } from "node:fs";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
for (const f of ["db/migrations/0001_init.sql", "db/seed_itbooster.sql"]) {
  console.log("applying", f);
  await sql.unsafe(readFileSync(f, "utf8"));
}
await sql.end();
console.log("ok");
```

- [ ] **Step 3: `src/server/db.ts`**

```ts
import postgres from "postgres";
// singleton server-only
declare global { var __sql: ReturnType<typeof postgres> | undefined; }
export const sql = globalThis.__sql ?? postgres(process.env.DATABASE_URL!, { max: 5 });
if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
```

- [ ] **Step 4: `src/server/brands.ts` e `src/server/posts.ts`**

```ts
// brands.ts
import { sql } from "./db";
export type Brand = { id: string; slug: string; nome: string; cor_principal: string; cor_apoio: string[]; fonte: string; tom_voz: string; ig_user_id: string | null; ig_token: string | null; site_url: string; ativo: boolean };
export async function getBrand(slug: string): Promise<Brand | null> {
  const [b] = await sql<Brand[]>`select * from brands where slug = ${slug} limit 1`;
  return b ?? null;
}
export async function listBrands(): Promise<Brand[]> { return sql<Brand[]>`select * from brands where ativo order by nome`; }
```
```ts
// posts.ts
import { sql } from "./db";
export type PostStatus = "draft" | "approved" | "scheduled" | "published" | "failed";
export type Post = { id: string; brand_id: string; tipo: "carousel"|"image"|"reel"; formato: string; legenda: string; hashtags: string[]; media: string[]; scheduled_at: string | null; status: PostStatus; external_url: string | null };
export async function getPost(id: string): Promise<Post | null> { const [p] = await sql<Post[]>`select * from posts where id=${id}`; return p ?? null; }
export async function listPosts(brandId?: string): Promise<Post[]> {
  return brandId ? sql<Post[]>`select * from posts where brand_id=${brandId} order by created_at desc`
                 : sql<Post[]>`select * from posts order by created_at desc`;
}
export async function createPost(i: { brand_id: string; tipo: Post["tipo"]; formato: string; legenda: string; hashtags: string[]; media: string[] }): Promise<Post> {
  const [p] = await sql<Post[]>`insert into posts ${sql(i as any)} returning *`; return p;
}
export async function setPostStatus(id: string, status: PostStatus, patch: Partial<Post> & { erro?: string } = {}): Promise<void> {
  await sql`update posts set status=${status}, external_url=${patch.external_url ?? null}, erro=${(patch as any).erro ?? null}, updated_at=now() where id=${id}`;
}
```

- [ ] **Step 5: Aplicar + verificar (integração contra Supabase local/dev)**

Run: `DATABASE_URL=... npm run db:migrate`
Expected: imprime "applying ..." e "ok". Depois: `psql $DATABASE_URL -c "select slug from brands"` mostra `itbooster`.
(Se não houver Postgres acessível no ambiente do agente, marcar este step como pendente de validação em ambiente com DB e seguir; os libs são exercitados na Task 6 com o db mockado.)

- [ ] **Step 6: Commit**

```bash
git add db scripts src/server/db.ts src/server/brands.ts src/server/posts.ts && git commit --author="inael <inael.rodrigues@gmail.com>" -m "feat: schema supabase + camada de dados (brands/posts)"
```

---

### Task 6: `publishPost` — orquestra media → graph → logs → status (TDD com deps injetadas)

**Files:**
- Create: `src/server/publish.ts`, `src/server/publish.test.ts`

**Interfaces:**
- Consumes: `getPost`/`setPostStatus` (posts.ts), `getBrand` (brands.ts), `publishImages` (graph.ts), `formatCaption` (caption.ts), `sql` (logs).
- Produces: `publishPost(postId: string): Promise<{ ok: true; url: string | null } | { ok: false; error: string }>`.
  - Resolve a conta IG: usa `brand.ig_user_id`/`brand.ig_token`; se null, cai pro env `META_<SLUG_UPPER>_IG_USER_ID`/`_ACCESS_TOKEN` (ex.: `META_ITBOOSTER_*`).
  - **Guarda:** só publica se `post.status === 'approved'`. Senão retorna `{ok:false,error:'not_approved'}`.
  - As `media` do post JÁ são URLs públicas (R2). (Upload de arquivo local acontece na criação; fora deste slice.)

Para testar sem tocar Graph/DB reais, `publishPost` recebe um objeto `deps` opcional (default = os reais):

- [ ] **Step 1: Teste que falha**

```ts
import { describe, it, expect, vi } from "vitest";
import { publishPost } from "./publish";

const brand = { id: "b1", slug: "itbooster", ig_user_id: "IG1", ig_token: "T", nome: "IT Booster" } as any;

function deps(overrides: any = {}) {
  return {
    getPost: vi.fn().mockResolvedValue({ id: "p1", brand_id: "b1", status: "approved", media: ["https://img/1.jpg"], legenda: "oi", hashtags: ["a"] }),
    getBrand: vi.fn().mockResolvedValue(brand),
    getBrandById: vi.fn().mockResolvedValue(brand),
    publishImages: vi.fn().mockResolvedValue({ mediaId: "M1", permalink: "https://insta/p/x" }),
    setPostStatus: vi.fn().mockResolvedValue(undefined),
    logPublish: vi.fn().mockResolvedValue(undefined),
    env: {},
    ...overrides,
  };
}

describe("publishPost", () => {
  it("publica post aprovado e marca published", async () => {
    const d = deps();
    const r = await publishPost("p1", d as any);
    expect(r).toEqual({ ok: true, url: "https://insta/p/x" });
    expect(d.publishImages).toHaveBeenCalledWith({ igUserId: "IG1", token: "T" }, ["https://img/1.jpg"], "oi\n\n#a");
    expect(d.setPostStatus).toHaveBeenCalledWith("p1", "published", { external_url: "https://insta/p/x" });
  });

  it("recusa post nao aprovado", async () => {
    const d = deps({ getPost: vi.fn().mockResolvedValue({ id: "p1", status: "draft", brand_id: "b1", media: ["a"], legenda: "", hashtags: [] }) });
    const r = await publishPost("p1", d as any);
    expect(r).toEqual({ ok: false, error: "not_approved" });
    expect(d.publishImages).not.toHaveBeenCalled();
  });

  it("em falha do graph marca failed", async () => {
    const d = deps({ publishImages: vi.fn().mockRejectedValue(new Error("boom")) });
    const r = await publishPost("p1", d as any);
    expect(r).toEqual({ ok: false, error: "boom" });
    expect(d.setPostStatus).toHaveBeenCalledWith("p1", "failed", { erro: "boom" });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar** → `npx vitest run src/server/publish.test.ts` = FAIL.

- [ ] **Step 3: Implementar**

```ts
import { getPost, setPostStatus } from "./posts";
import { getBrand } from "./brands";
import { publishImages } from "./graph";
import { formatCaption } from "@/lib/caption";
import { sql } from "./db";

async function getBrandById(id: string) { const [b] = await sql<any[]>`select * from brands where id=${id}`; return b ?? null; }
async function logPublish(postId: string, rede: string, status: string, externalId: string | null, erro: string | null) {
  await sql`insert into publish_logs (post_id, rede, status, external_id, erro) values (${postId}, ${rede}, ${status}, ${externalId}, ${erro})`;
}

type Deps = {
  getPost: typeof getPost; getBrandById: typeof getBrandById; publishImages: typeof publishImages;
  setPostStatus: typeof setPostStatus; logPublish: typeof logPublish; env: Record<string, string | undefined>;
};
const realDeps: Deps = { getPost, getBrandById, publishImages, setPostStatus, logPublish, env: process.env };

function resolveAccount(brand: any, env: Record<string, string | undefined>) {
  if (brand.ig_user_id && brand.ig_token) return { igUserId: brand.ig_user_id, token: brand.ig_token };
  const p = brand.slug.toUpperCase();
  const id = env[`META_${p}_IG_USER_ID`], tok = env[`META_${p}_ACCESS_TOKEN`];
  if (id && tok) return { igUserId: id, token: tok };
  throw new Error(`sem credenciais IG pra brand ${brand.slug}`);
}

export async function publishPost(postId: string, deps: Deps = realDeps): Promise<{ ok: true; url: string | null } | { ok: false; error: string }> {
  const post = await deps.getPost(postId);
  if (!post) return { ok: false, error: "post_not_found" };
  if (post.status !== "approved") return { ok: false, error: "not_approved" };
  const brand = await deps.getBrandById(post.brand_id);
  if (!brand) return { ok: false, error: "brand_not_found" };
  try {
    const acc = resolveAccount(brand, deps.env);
    const caption = formatCaption(post.legenda, post.hashtags);
    const { mediaId, permalink } = await deps.publishImages(acc, post.media, caption);
    await deps.logPublish(postId, "ig", "published", mediaId, null);
    await deps.setPostStatus(postId, "published", { external_url: permalink });
    return { ok: true, url: permalink };
  } catch (e: any) {
    const error = e?.message ?? String(e);
    await deps.logPublish(postId, "ig", "failed", null, error);
    await deps.setPostStatus(postId, "failed", { erro: error });
    return { ok: false, error };
  }
}
```
Nota de teste: o teste passa `deps` sem `getBrand` mas com `getBrandById`; ajustar o teste pra usar `getBrandById` (já usa). O `resolveAccount` cai pro env `META_ITBOOSTER_*` que já existe no vault → o piloto publica sem preencher `ig_token` no banco.

- [ ] **Step 4: Rodar e ver passar** → PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/server/publish.ts src/server/publish.test.ts && git commit --author="inael <inael.rodrigues@gmail.com>" -m "feat: publishPost (orquestra media->graph->logs->status)"
```

---

### Task 7: Auth Logto + endpoint de publish + GUI mínima

**Files:**
- Create: `src/app/logto/[...logto]/route.ts`, `src/lib/logto.ts`, `src/app/api/posts/[id]/publish/route.ts`, `src/app/(app)/posts/page.tsx`, `src/app/(app)/posts/actions.ts`

**Interfaces:**
- Consumes: `publishPost` (publish.ts), `listPosts`/`createPost`/`setPostStatus` (posts.ts), `getBrand` (brands.ts), Logto session.
- Produces: rota autenticada `POST /api/posts/[id]/publish` → `{ok,url}` ou `{ok:false,error}`; página `/posts`.

- [ ] **Step 1: Config Logto** (`src/lib/logto.ts`)

```ts
import { LogtoNextConfig } from "@logto/next";
export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!, appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!, baseUrl: process.env.LOGTO_BASE_URL!,
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!, cookieSecure: process.env.NODE_ENV === "production",
};
```
`src/app/logto/[...logto]/route.ts`: usar o handler oficial do `@logto/next/server-actions` (sign-in/sign-out/callback) conforme a doc da versão instalada. Verificar a doc do pacote instalado (`node_modules/@logto/next`) pra a API exata (App Router).

- [ ] **Step 2: Endpoint publish (com guarda de auth)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { publishPost } from "@/server/publish";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const { id } = await params;
  const r = await publishPost(id);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
```

- [ ] **Step 3: Server action de aprovar** (`actions.ts`)

```ts
"use server";
import { setPostStatus } from "@/server/posts";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
export async function approvePost(id: string) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
  await setPostStatus(id, "approved", {}); // aprovado_por = claims?.sub (adicionar coluna no update se quiser)
}
```

- [ ] **Step 4: Página `/posts`** (server component: lista + botões)

```tsx
import { listPosts } from "@/server/posts";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { redirect } from "next/navigation";
import { approvePost } from "./actions";

export default async function PostsPage() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
  const posts = await listPosts();
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.legenda.slice(0, 60) || "(sem legenda)"}</div>
              <div className="text-sm text-neutral-500">{p.tipo} · {p.status} · {p.media.length} mídia(s)</div>
            </div>
            <div className="flex gap-2">
              {p.status === "draft" && (
                <form action={approvePost.bind(null, p.id)}><button className="px-3 py-1 rounded bg-emerald-600 text-white">Aprovar</button></form>
              )}
              {p.status === "approved" && (
                <PublishButton id={p.id} />
              )}
              {p.external_url && <a className="px-3 py-1 rounded border" href={p.external_url} target="_blank">ver post</a>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

function PublishButton({ id }: { id: string }) {
  return (
    <form action={async () => { "use server"; const { publishPost } = await import("@/server/publish"); await publishPost(id); }}>
      <button className="px-3 py-1 rounded bg-purple-600 text-white">Publicar</button>
    </form>
  );
}
```
Nota: o `PublishButton` chama `publishPost` direto por server action (com guarda de status dentro). Alternativamente chamar o endpoint da Step 2 via fetch client-side pra ter toast; escolher um. Para o MVP, a server action basta.

- [ ] **Step 5: Verificar build e boot local**

Run: `npm run build && npm run start` (com `.env` preenchido com um DB de teste + Logto dev). Abrir `/posts`, logar via Logto, criar um post de teste (via SQL ou um form simples), aprovar, publicar.
Expected: post `approved` → botão Publicar → status vira `published` e aparece link do post. (Publicação real usa `META_ITBOOSTER_*` do env; conferir no @itboosterglobal.)

- [ ] **Step 6: Commit**

```bash
git add src/app src/lib/logto.ts && git commit --author="inael <inael.rodrigues@gmail.com>" -m "feat: auth Logto + endpoint publish + GUI /posts"
```

---

### Task 8: Deploy Vercel (midiaplay.net) + Logto (auth.midiaplay.net) + status dashboard

**Files:**
- Create: `docs/runbooks/deploy-marketing-studio.md`

Domínio decidido (2026-08-03): **midiaplay.net** (produto "Midia Play"), auth em **auth.midiaplay.net**.
midiaplay.net já aponta pra Vercel (`@`→216.198.79.1, `www`→vercel-dns) → app vai pra **Vercel**.

- [ ] **Step 1: Deploy Vercel** — projeto "marketing-studio" no team IT Booster; adicionar domínio `midiaplay.net`. Setar envs em Production (DATABASE_URL do Supabase self-hosted na VPS, LOGTO_*, R2_*, META_ITBOOSTER_*). Deploy via git push/CLI (autor inael).

- [ ] **Step 2: Migration** uma vez: `DATABASE_URL=... node scripts/migrate.mjs` (local apontando pro Postgres do Supabase self-hosted).

- [ ] **Step 3: Logto** — Logto roda na VPS; `auth.midiaplay.net` (A → 72.61.135.214) é fachada Traefik do Logto. Criar app "marketing-studio" no Logto, redirect `https://midiaplay.net/logto/callback`, preencher LOGTO_* (ENDPOINT=`https://auth.midiaplay.net`). Ver [[reference_logto_dominio_auth_proprio]] — issuer fica fixo no ENV ENDPOINT do Logto, não trocar por-app.

- [ ] **Step 4: Cadastrar `https://midiaplay.net` no status dashboard** (status.toolpad.cloud).

- [ ] **Step 5: Smoke test em prod** — logar via auth.midiaplay.net, publicar 1 post de teste no @itboosterglobal, apagar depois.

- [ ] **Step 6: Commit** do runbook.

---

## Self-Review

**1. Cobertura da spec (Fase 0 + núcleo da Fase A):**
- Repo/scaffold + `.itbooster-meta.yaml` (já existe) → Task 1 + Task 8. ✓
- Schema (brands/posts/media/logs) → Task 5. ✓
- Publicação IG oficial (reuso do ig_graph, multi-conta via env/brand) → Tasks 3 + 6. ✓
- Mídia em URL pública (R2) → Task 4. ✓
- Fluxo `draft→approved→published/failed` + revisão humana → Tasks 5/6/7. ✓
- GUI (subset: /posts com aprovar/publicar) → Task 7. Calendário/`/create` completo/`/brands`/`/library` → **próximos planos**.
- Auth Logto → Task 7/8. ✓
- **Fora deste plano (próximos sub-planos):** agendamento (Inngest), geração (Higgsfield + carousel builder + legenda LLM), LinkedIn, biblioteca de mídia, calendário visual, motor de concorrentes (§11 da spec).

**2. Placeholders:** sem TODO/TBD; código real em cada step. A API exata do `@logto/next` (App Router) é "verificar na doc do pacote instalado" — é uma dependência externa versionada, não um placeholder de lógica nossa.

**3. Consistência de tipos:** `IgAccount {igUserId, token}` usado igual em graph.ts e publish.ts; `publishImages(acc, urls, caption)` idem; `setPostStatus(id, status, patch)` idem entre posts.ts e publish.ts. ✓

## Escopo dos próximos planos (para decompor depois)
- `2026-…-agendamento-inngest.md`: `scheduled_at` + Inngest cron + retry/DLQ + alerta Discord.
- `2026-…-geracao-conteudo.md`: `build_carousel.mjs` parametrizado por brand kit + Higgsfield MCP + legenda LLM + `/create` completo + `/library`.
- `2026-…-linkedin.md`: módulo LinkedIn (Community Management API) + agendamento.
- `2026-…-motor-concorrentes.md`: Business Discovery + proposta diária + aprovação no Discord (spec §11).
