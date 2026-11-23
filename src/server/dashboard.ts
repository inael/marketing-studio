import { sql } from "./db";
import { listAllBrands, avatarOf } from "./brands";
import { getSettings } from "./settings";
import { resolveIg } from "./planner";

export type WeeklyCard = {
  key: string;
  label: string;
  atual: number;
  anterior: number;
  goodWhenUp: boolean;
  href: string;
};

// Fila "Precisa de voce": ordenada por urgencia (falha > sem conexao > rascunho).
export type Pendencia = {
  key: string;
  tipo: "falha" | "conexao" | "rascunho";
  titulo: string;
  detalhe: string;
  acao: string;
  href: string;
};

export type DashboardData = {
  pendencias: Pendencia[];
  weekly: WeeklyCard[];
  posts: Record<string, number>;
  deleted: number;
  publishedWeek: number;
  brandsAtivas: number;
  suggestions: number;
  nextScheduled: {
    id: string;
    slug: string;
    nome: string;
    cor: string;
    legenda: string;
    scheduled_at: string;
    tipo: string;
  }[];
  pendingByBrand: { slug: string; nome: string; cor: string; drafts: number }[];
  connections: {
    slug: string;
    nome: string;
    cor: string;
    ig: boolean;
    linkedin: boolean;
    picture: string | null;
  }[];
  automation: { sugestoes: boolean; gestor: boolean };
  // D01: saude de cada marca (carteira)
  saude: { slug: string; nome: string; cor: string; semana: number; anterior: number; pendencias: number; conectada: boolean }[];
  // D02: meta da semana (2 posts por marca)
  meta: { porMarca: number; total: number; publicados: number; agendados: number; anteriorPublicados: number };
};

// B47: o resumo do painel fica em cache por 30 s (o painel e aberto muitas vezes seguidas)
let cacheDash: { em: number; dados: DashboardData } | null = null;
const TTL_DASH_MS = 30000;

export async function dashboardSummary(): Promise<DashboardData> {
  if (cacheDash && Date.now() - cacheDash.em < TTL_DASH_MS) return cacheDash.dados;
  const dados = await calcularDashboard();
  cacheDash = { em: Date.now(), dados };
  return dados;
}

/** descarta o cache do painel (chamado quando um post muda) */
export function invalidarDashboard() {
  cacheDash = null;
}

async function calcularDashboard(): Promise<DashboardData> {
  const [statusRows, delRow, weekRow, sugRow, nextRows, pendRows, brands, settings] =
    await Promise.all([
      sql<{ status: string; n: number }[]>`
        select status, count(*)::int as n from posts where deleted_at is null group by status`,
      sql<{ n: number }[]>`select count(*)::int as n from posts where deleted_at is not null`,
      sql<{ n: number }[]>`
        select count(*)::int as n from posts
        where status='published' and deleted_at is null and updated_at >= now() - interval '7 days'`,
      sql<{ n: number }[]>`select count(*)::int as n from suggestions where status='nova'`,
      sql<
        { id: string; slug: string; nome: string; cor: string; legenda: string; scheduled_at: string; tipo: string }[]
      >`
        select p.id, b.slug, b.nome, b.cor_principal as cor, p.legenda, p.scheduled_at, p.tipo
        from posts p join brands b on b.id = p.brand_id
        where p.status='scheduled' and p.deleted_at is null and p.scheduled_at is not null
        order by p.scheduled_at asc limit 6`,
      sql<{ slug: string; nome: string; cor: string; drafts: number }[]>`
        select b.slug, b.nome, b.cor_principal as cor, count(*)::int as drafts
        from posts p join brands b on b.id = p.brand_id
        where p.status='draft' and p.deleted_at is null
        group by b.slug, b.nome, b.cor_principal
        order by drafts desc`,
      listAllBrands(),
      getSettings(),
    ]);

  const posts = Object.fromEntries(statusRows.map((r) => [r.status, r.n]));

  // Comparacao com a semana anterior, calculada no servidor (funciona no banco real e no simulado).
  const [allPosts, allSugs] = await Promise.all([
    sql<{ id: string; brand_id: string; legenda: string; erro: string | null; status: string; tipo: string; scheduled_at: string | null; created_at: Date; updated_at: Date; deleted_at: Date | null }[]>`select id, brand_id, legenda, erro, status, tipo, scheduled_at, created_at, updated_at, deleted_at from posts`,
    sql<{ status: string; created_at: Date }[]>`select status, created_at from suggestions`,
  ]);
  const now = Date.now();
  const DAY = 86_400_000;
  const inWin = (d: Date | null | undefined, from: number, to: number) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    return t > from && t <= to;
  };
  const cur = { from: now - 7 * DAY, to: now };
  const prev = { from: now - 14 * DAY, to: now - 7 * DAY };
  const live = allPosts.filter((p) => !p.deleted_at);

  // Listas por marca calculadas aqui (mesmo resultado no banco real e no simulado).
  const nextScheduled = live
    .filter((p) => p.status === "scheduled" && p.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 6)
    .map((p) => {
      const b = brands.find((x) => x.id === p.brand_id);
      return {
        id: p.id,
        slug: b?.slug ?? "",
        nome: b?.nome ?? "",
        cor: b?.cor_principal ?? "#999999",
        legenda: p.legenda ?? "",
        scheduled_at: p.scheduled_at!,
        tipo: p.tipo,
      };
    });
  const pendingByBrand = brands
    .map((b) => ({
      slug: b.slug,
      nome: b.nome,
      cor: b.cor_principal,
      drafts: live.filter((p) => p.brand_id === b.id && p.status === "draft").length,
    }))
    .filter((x) => x.drafts > 0)
    .sort((a, b) => b.drafts - a.drafts);

  // Fila de pendencias (D01): falhas primeiro, depois contas sem conexao, depois rascunhos.
  const brandOf = (id: string) => brands.find((b) => b.id === id);
  const falhas: Pendencia[] = live
    .filter((p) => p.status === "failed")
    .map((p) => {
      const b = brandOf(p.brand_id);
      const token = /token|expir|autoriz/i.test(p.erro ?? "");
      return {
        key: `falha-${p.id}`,
        tipo: "falha" as const,
        titulo: `Post: ${(p.legenda ?? "").trim().slice(0, 60) || "(sem legenda)"} · ${b?.nome ?? "?"}`,
        detalhe: p.erro ?? "Falha na publicação",
        acao: token ? "Reconectar" : "Ver",
        href: token && b ? `/marcas/${b.slug}/conectar` : "/posts",
      };
    });
  const semConexao: Pendencia[] = brands
    .filter((b) => b.ativo && !resolveIg(b))
    .map((b) => ({
      key: `conexao-${b.slug}`,
      tipo: "conexao" as const,
      titulo: `Conta do Instagram ${b.nome}`,
      detalhe: "ainda não conectada",
      acao: "Conectar",
      href: `/marcas/${b.slug}/conectar`,
    }));
  const rascunhos: Pendencia[] = pendingByBrand.map((r) => ({
    key: `rascunho-${r.slug}`,
    tipo: "rascunho" as const,
    titulo: `Rascunhos · ${r.nome}`,
    detalhe: `${r.drafts} sem arte ou aprovação`,
    acao: "Escrever",
    href: "/posts",
  }));
  const pendencias = [...falhas, ...semConexao, ...rascunhos];
  const count = (fn: (p: (typeof live)[number]) => boolean) => live.filter(fn).length;
  const weekly: WeeklyCard[] = [
    {
      key: "publicados",
      label: "Publicados",
      atual: count((p) => p.status === "published" && inWin(p.updated_at, cur.from, cur.to)),
      anterior: count((p) => p.status === "published" && inWin(p.updated_at, prev.from, prev.to)),
      goodWhenUp: true,
      href: "/posts",
    },
    {
      key: "agendados",
      label: "Agendados",
      atual: count((p) => p.status === "scheduled" && inWin(p.updated_at, cur.from, cur.to)),
      anterior: count((p) => p.status === "scheduled" && inWin(p.updated_at, prev.from, prev.to)),
      goodWhenUp: true,
      href: "/posts",
    },
    {
      key: "rascunhos",
      label: "Rascunhos parados",
      atual: count((p) => p.status === "draft"),
      anterior: count((p) => p.status === "draft" && new Date(p.created_at).getTime() <= prev.to),
      goodWhenUp: false,
      href: "/posts",
    },
    {
      key: "sugestoes",
      label: "Sugestões aproveitadas",
      atual: allSugs.filter((x) => x.status === "aceita" && inWin(x.created_at, cur.from, cur.to)).length,
      anterior: allSugs.filter((x) => x.status === "aceita" && inWin(x.created_at, prev.from, prev.to)).length,
      goodWhenUp: true,
      href: "/sugestoes",
    },
  ];

  const connections = brands
    .filter((b) => b.ativo)
    .map((b) => ({
      slug: b.slug,
      nome: b.nome,
      cor: b.cor_principal,
      ig: Boolean(resolveIg(b)),
      linkedin: Boolean(b.linkedin_org_id),
      picture: avatarOf(b),
    }));

  // D01/D02: saude por marca e meta da semana
  const dataDoPost = (p: { scheduled_at: string | null; updated_at: Date | string }) =>
    p.scheduled_at ? new Date(p.scheduled_at) : new Date(p.updated_at);
  const emMeta = (p: { status: string }) => ["scheduled", "approved", "published"].includes(p.status);
  const META_POR_MARCA = 2;
  const saude = brands.map((b) => {
    const meus = live.filter((p) => p.brand_id === b.id);
    return {
      slug: b.slug,
      nome: b.nome,
      cor: b.cor_principal,
      semana: meus.filter((p) => emMeta(p) && inWin(dataDoPost(p), cur.from, now + 7 * DAY)).length,
      anterior: meus.filter((p) => emMeta(p) && inWin(dataDoPost(p), prev.from, prev.to)).length,
      pendencias: meus.filter((p) => p.status === "draft" || p.status === "failed").length,
      conectada: Boolean(b.ig_user_id) || Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]),
    };
  });
  const meta = {
    porMarca: META_POR_MARCA,
    total: META_POR_MARCA * brands.length,
    publicados: live.filter((p) => p.status === "published" && inWin(dataDoPost(p), cur.from, cur.to)).length,
    agendados: live.filter((p) => (p.status === "scheduled" || p.status === "approved") && inWin(dataDoPost(p), cur.to, now + 7 * DAY)).length,
    anteriorPublicados: live.filter((p) => p.status === "published" && inWin(dataDoPost(p), prev.from, prev.to)).length,
  };
  return {
    saude,
    meta,
    pendencias,
    weekly,
    posts,
    deleted: delRow[0]?.n ?? 0,
    publishedWeek: weekRow[0]?.n ?? 0,
    brandsAtivas: brands.filter((b) => b.ativo).length,
    suggestions: sugRow[0]?.n ?? 0,
    nextScheduled,
    pendingByBrand,
    connections,
    automation: {
      sugestoes: settings.automacao_ativa === "on",
      gestor: settings.automacao_gestor === "on",
    },
  };
}
