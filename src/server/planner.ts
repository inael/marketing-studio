import type { AiConfig } from "./settings";
import { getBrandById, type Brand } from "./brands";
import { listSources } from "./sources";
import { listAnalysts, type Persona } from "./personas";
import { fetchRss, competitorTopPosts, type CompetitorPost, type RssItem } from "./signals";
import { logUsage, usageFrom } from "./usage";

// Núcleo de geração de sugestões, compartilhado entre a rota /api/ai/suggest
// (uso manual, por fonte) e os crons de automação (uso hands-off, ambas).

export type Fonte = "noticia" | "concorrente";

export type Idea = {
  titulo?: string;
  angulo?: string;
  legenda?: string;
  formato?: string;
  analista?: string;
  hashtags?: string[];
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
type RawIdea = {
  titulo?: string;
  angulo?: string;
  legenda?: string;
  formato?: string;
  fonte_idx?: number;
  imagem_prompt?: string;
  hashtags?: string[];
};

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

type ChatOut = { parsed: unknown; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } };
const ZERO = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

async function chatJson(cfg: AiConfig, model: string, sys: string, user: string): Promise<ChatOut> {
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
        max_tokens: 900,
      }),
    });
    if (!r.ok) return { parsed: null, usage: ZERO };
    const data = await r.json();
    return { parsed: extractJson(String(data?.choices?.[0]?.message?.content ?? "")), usage: usageFrom(data) };
  } catch {
    return { parsed: null, usage: ZERO };
  }
}

const norm = (h: unknown): string[] =>
  Array.isArray(h)
    ? h.map((x) => String(x).replace(/^#/, "").replace(/\s+/g, "").trim()).filter(Boolean).slice(0, 6)
    : [];

async function callAnalyst(
  cfg: AiConfig,
  a: Persona,
  brand: Brand,
  fonte: Fonte,
  signals: string,
  feedback?: string
): Promise<{ analista: string; idea: RawIdea } | null> {
  const model = a.modelo || cfg.model;
  const alvo =
    fonte === "concorrente"
      ? "inspirada nos CONCORRENTES (tema/ângulo que engajou; NUNCA copie a legenda deles)"
      : "inspirada nas NOTÍCIAS";
  const sys = `Você é ${a.nome}, analista de mídias sociais da ${brand.nome} (${brand.site_url}). Persona: ${
    a.tracos || "equilibrado"
  }. Skills: ${a.skills || "geral"}. ${a.instrucoes} Tom de voz da marca: ${
    brand.tom_voz || "profissional e claro"
  }. Com base nos SINAIS (itens numerados [n]), proponha 1 POST COMPLETO ${alvo}, no SEU estilo. Regras: conecte ao que a marca faz; legenda pronta em pt-BR, 1-3 frases, sem travessão; inclua de 3 a 6 HASHTAGS relevantes (sem #); em "fonte_idx" devolva o número [n] do item usado; em "imagem_prompt" escreva EM PORTUGUÊS um prompt curto e realista pra a imagem (foto editorial, sem texto, sem cara de IA, nada de roxo/neon).${
    feedback ? ` Feedback do gestor pra melhorar: ${feedback}` : ""
  } Responda SOMENTE JSON: {"titulo":"","angulo":"","legenda":"","formato":"image|carousel|reel","fonte_idx":0,"imagem_prompt":"","hashtags":["",""]}.`;
  const { parsed, usage } = await chatJson(cfg, model, sys, signals);
  await logUsage({ persona: a.nome, tipo: "sugestao", model, brand_id: brand.id, ...usage });
  const idea = parsed as RawIdea | null;
  if (!idea?.legenda) return null;
  return { analista: a.nome, idea };
}

const idxOf = (n: unknown, max: number) => (typeof n === "number" && n >= 0 && n < max ? n : null);

/** Gera sugestões do time. opts.fonte limita a uma fonte; sem fonte, gera ambas. */
export async function generateSuggestions(
  brand: Brand,
  cfg: AiConfig,
  opts: { fonte?: Fonte; feedback?: string } = {}
): Promise<SuggestResult> {
  const { fonte, feedback } = opts;
  const [sources, analystsRaw] = await Promise.all([listSources(brand.id), listAnalysts()]);
  const analysts =
    analystsRaw.length > 0
      ? analystsRaw
      : ([{ id: "", nome: "Analista", papel: "analista", tracos: "", instrucoes: "", modelo: "", skills: "", ativo: true }] as Persona[]);
  const warnings: string[] = [];
  const meta = { rss: 0, competitors: 0, warnings };

  async function genForFonte(f: Fonte): Promise<Idea[]> {
    let signals = "";
    let refs: { url: string | null; label: string | null }[] = [];

    if (f === "noticia") {
      const rssUrls = sources.filter((s) => s.kind === "rss").slice(0, 3);
      const rssItems: RssItem[] = (await Promise.all(rssUrls.map((s) => fetchRss(s.value)))).flat().slice(0, 12);
      meta.rss = rssItems.length;
      refs = rssItems.map((i) => ({ url: i.link || null, label: i.title || null }));
      signals = rssItems.length
        ? `NOTÍCIAS:\n${rssItems.map((i, idx) => `[${idx}] ${i.title}`).join("\n")}`
        : "NOTÍCIAS: (nenhuma; use conhecimento do setor)";
    } else {
      const comps = sources.filter((s) => s.kind === "competitor").slice(0, 5);
      const acc = resolveIg(brand);
      let compPosts: CompPost[] = [];
      if (acc && comps.length) {
        const batches = await Promise.all(
          comps.map(async (c) => (await competitorTopPosts(acc, c.value, 2)).map((p) => ({ ...p, username: c.value })))
        );
        compPosts = batches.flat().sort((a, b) => b.likes + b.comments - (a.likes + a.comments)).slice(0, 8);
      } else if (comps.length && !acc) {
        warnings.push("sem conta IG conectada pra ler concorrentes");
      }
      meta.competitors = compPosts.length;
      refs = compPosts.map((p) => ({ url: p.permalink ?? null, label: `@${p.username}` }));
      signals = compPosts.length
        ? `CONCORRENTES (o que engajou; inspiração de tema, não copiar):\n${compPosts
            .map((p, idx) => `[${idx}] @${p.username} (${p.likes} curtidas): ${(p.caption || "").replace(/\s+/g, " ").slice(0, 140)}`)
            .join("\n")}`
        : "CONCORRENTES: (sem dados; proponha com base no posicionamento da marca)";
    }

    const results = (await Promise.all(analysts.map((a) => callAnalyst(cfg, a, brand, f, signals, feedback)))).filter(
      Boolean
    ) as { analista: string; idea: RawIdea }[];

    return results.map(({ analista, idea }) => {
      const i = idxOf(idea.fonte_idx, refs.length);
      return {
        titulo: idea.titulo,
        angulo: idea.angulo,
        legenda: idea.legenda,
        formato: idea.formato,
        analista,
        hashtags: norm(idea.hashtags),
        imagem_prompt: idea.imagem_prompt ?? null,
        ref_url: i !== null ? refs[i].url : null,
        ref_label: i !== null ? refs[i].label : null,
      } as Idea;
    });
  }

  const noticias = !fonte || fonte === "noticia" ? await genForFonte("noticia") : [];
  const concorrentes = !fonte || fonte === "concorrente" ? await genForFonte("concorrente") : [];

  return {
    noticias,
    concorrentes,
    analysts: analysts.map((a) => ({ nome: a.nome, modelo: a.modelo || cfg.model })),
    meta,
  };
}

export async function generateSuggestionsById(
  brandId: string,
  cfg: AiConfig,
  opts: { fonte?: Fonte; feedback?: string } = {}
): Promise<SuggestResult | null> {
  const brand = await getBrandById(brandId);
  if (!brand) return null;
  return generateSuggestions(brand, cfg, opts);
}
