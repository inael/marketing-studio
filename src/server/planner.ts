import type { AiConfig } from "./settings";
import { getBrandById, type Brand } from "./brands";
import { listSources } from "./sources";
import { listAnalysts, type Persona } from "./personas";
import { fetchRss, competitorTopPosts, type CompetitorPost, type RssItem } from "./signals";

// Núcleo de geração de sugestões, compartilhado entre a rota /api/ai/suggest
// (uso manual) e os crons de automação (uso hands-off).

export type Idea = {
  titulo?: string;
  angulo?: string;
  legenda?: string;
  formato?: string;
  analista?: string;
  ref_url?: string | null;
  ref_label?: string | null;
  imagem_prompt?: string | null;
};

export type SuggestResult = {
  noticias: Idea[];
  concorrentes: Idea[];
  analysts: { nome: string; modelo: string }[];
  meta: { rss: number; competitors: number; warnings: string[] };
};

type CompPost = CompetitorPost & { username: string };

/** resolve a conta IG da marca: colada na marca > env por-slug > env itbooster */
export function resolveIg(brand: Brand): { igUserId: string; token: string } | null {
  if (brand.ig_user_id && brand.ig_token) return { igUserId: brand.ig_user_id, token: brand.ig_token };
  const p = brand.slug.toUpperCase();
  if (process.env[`META_${p}_IG_USER_ID`] && process.env[`META_${p}_ACCESS_TOKEN`]) {
    return { igUserId: process.env[`META_${p}_IG_USER_ID`]!, token: process.env[`META_${p}_ACCESS_TOKEN`]! };
  }
  if (process.env.META_ITBOOSTER_IG_USER_ID && process.env.META_ITBOOSTER_ACCESS_TOKEN) {
    return { igUserId: process.env.META_ITBOOSTER_IG_USER_ID, token: process.env.META_ITBOOSTER_ACCESS_TOKEN };
  }
  return null;
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(text.slice(a, b + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function chatJson(cfg: AiConfig, model: string, sys: string, user: string): Promise<unknown> {
  try {
    const r = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.85,
        max_tokens: 1100,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return extractJson(String(data?.choices?.[0]?.message?.content ?? ""));
  } catch {
    return null;
  }
}

type RawIdea = { titulo?: string; angulo?: string; legenda?: string; formato?: string; fonte_idx?: number; imagem_prompt?: string };

async function callAnalyst(
  cfg: AiConfig,
  a: Persona,
  brand: Brand,
  signals: string,
  feedback?: string
): Promise<{ analista: string; noticia?: RawIdea; concorrente?: RawIdea } | null> {
  const model = a.modelo || cfg.model;
  const sys = `Você é ${a.nome}, analista de mídias sociais da ${brand.nome} (${brand.site_url}). Persona: ${
    a.tracos || "equilibrado"
  }. Skills: ${a.skills || "geral"}. ${a.instrucoes} Tom de voz da marca: ${
    brand.tom_voz || "profissional e claro"
  }. Com base nos SINAIS (cada item vem numerado [n]), proponha 1 ideia de post inspirada nas NOTÍCIAS e 1 inspirada nos CONCORRENTES, no SEU estilo. Regras: conecte ao que a marca faz; NUNCA copie a legenda do concorrente; legenda pronta em pt-BR, 1-3 frases, sem hashtags, sem travessão. Em "fonte_idx" devolva o número [n] do item que você usou. Em "imagem_prompt" escreva, EM INGLÊS, um prompt curto e realista pra gerar a imagem do post (foto editorial, sem texto, sem cara de IA, nada de roxo/neon).${
    feedback ? ` Feedback do gestor pra melhorar: ${feedback}` : ""
  } Responda SOMENTE JSON: {"noticia":{"titulo":"","angulo":"","legenda":"","formato":"image|carousel|reel","fonte_idx":0,"imagem_prompt":""},"concorrente":{"titulo":"","angulo":"","legenda":"","formato":"image|carousel|reel","fonte_idx":0,"imagem_prompt":""}}.`;
  const parsed = (await chatJson(cfg, model, sys, signals)) as {
    noticia?: RawIdea;
    concorrente?: RawIdea;
  } | null;
  if (!parsed) return null;
  return { analista: a.nome, noticia: parsed.noticia, concorrente: parsed.concorrente };
}

/** Gera as sugestões do time (analistas em paralelo) para uma marca. */
export async function generateSuggestions(
  brand: Brand,
  cfg: AiConfig,
  feedback?: string
): Promise<SuggestResult> {
  const [sources, analystsRaw] = await Promise.all([listSources(brand.id), listAnalysts()]);
  const rssUrls = sources.filter((s) => s.kind === "rss").slice(0, 3);
  const comps = sources.filter((s) => s.kind === "competitor").slice(0, 5);

  const rssBatches = await Promise.all(rssUrls.map((s) => fetchRss(s.value)));
  const rssItems: RssItem[] = rssBatches.flat().slice(0, 12);

  const acc = resolveIg(brand);
  const warnings: string[] = [];
  let compPosts: CompPost[] = [];
  if (acc && comps.length) {
    const batches = await Promise.all(
      comps.map(async (c) => (await competitorTopPosts(acc, c.value, 2)).map((p) => ({ ...p, username: c.value })))
    );
    compPosts = batches.flat().sort((a, b) => b.likes + b.comments - (a.likes + a.comments)).slice(0, 8);
  } else if (comps.length && !acc) {
    warnings.push("sem conta IG conectada pra ler concorrentes");
  }

  const signals = [
    rssItems.length
      ? `NOTÍCIAS:\n${rssItems.map((i, idx) => `[${idx}] ${i.title}`).join("\n")}`
      : "NOTÍCIAS: (nenhuma; use conhecimento do setor)",
    compPosts.length
      ? `CONCORRENTES (o que engajou; inspiração de tema, não copiar):\n${compPosts
          .map((p, idx) => `[${idx}] @${p.username} (${p.likes} curtidas): ${(p.caption || "").replace(/\s+/g, " ").slice(0, 140)}`)
          .join("\n")}`
      : "CONCORRENTES: (sem dados; proponha com base no posicionamento da marca)",
  ].join("\n\n");

  const analysts =
    analystsRaw.length > 0
      ? analystsRaw
      : ([{ id: "", nome: "Analista", papel: "analista", tracos: "", instrucoes: "", modelo: "", skills: "", ativo: true }] as Persona[]);

  const results = (
    await Promise.all(analysts.map((a) => callAnalyst(cfg, a, brand, signals, feedback)))
  ).filter(Boolean) as { analista: string; noticia?: RawIdea; concorrente?: RawIdea }[];

  const idxOf = (n: unknown, max: number) =>
    typeof n === "number" && n >= 0 && n < max ? n : null;

  const noticias: Idea[] = results
    .map((r) => {
      const n = r.noticia;
      if (!n?.legenda) return null;
      const i = idxOf(n.fonte_idx, rssItems.length);
      return {
        titulo: n.titulo,
        angulo: n.angulo,
        legenda: n.legenda,
        formato: n.formato,
        analista: r.analista,
        imagem_prompt: n.imagem_prompt ?? null,
        ref_url: i !== null ? rssItems[i].link || null : null,
        ref_label: i !== null ? rssItems[i].title || null : null,
      } as Idea;
    })
    .filter(Boolean) as Idea[];

  const concorrentes: Idea[] = results
    .map((r) => {
      const c = r.concorrente;
      if (!c?.legenda) return null;
      const i = idxOf(c.fonte_idx, compPosts.length);
      return {
        titulo: c.titulo,
        angulo: c.angulo,
        legenda: c.legenda,
        formato: c.formato,
        analista: r.analista,
        imagem_prompt: c.imagem_prompt ?? null,
        ref_url: i !== null ? compPosts[i].permalink ?? null : null,
        ref_label: i !== null ? `@${compPosts[i].username}` : null,
      } as Idea;
    })
    .filter(Boolean) as Idea[];

  return {
    noticias,
    concorrentes,
    analysts: analysts.map((a) => ({ nome: a.nome, modelo: a.modelo || cfg.model })),
    meta: { rss: rssItems.length, competitors: compPosts.length, warnings },
  };
}

/** id de marca -> resultado (usado pela rota). */
export async function generateSuggestionsById(
  brandId: string,
  cfg: AiConfig,
  feedback?: string
): Promise<SuggestResult | null> {
  const brand = await getBrandById(brandId);
  if (!brand) return null;
  return generateSuggestions(brand, cfg, feedback);
}
