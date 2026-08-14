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
};

export type SuggestResult = {
  noticias: Idea[];
  concorrentes: Idea[];
  analysts: { nome: string; modelo: string }[];
  meta: { rss: number; competitors: number; warnings: string[] };
};

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
        max_tokens: 900,
      }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return extractJson(String(data?.choices?.[0]?.message?.content ?? ""));
  } catch {
    return null;
  }
}

async function callAnalyst(
  cfg: AiConfig,
  a: Persona,
  brand: Brand,
  signals: string,
  feedback?: string
): Promise<{ analista: string; noticia?: Idea; concorrente?: Idea } | null> {
  const model = a.modelo || cfg.model;
  const sys = `Você é ${a.nome}, analista de mídias sociais da ${brand.nome} (${brand.site_url}). Persona: ${
    a.tracos || "equilibrado"
  }. Skills: ${a.skills || "geral"}. ${a.instrucoes} Tom de voz da marca: ${
    brand.tom_voz || "profissional e claro"
  }. Com base nos SINAIS, proponha 1 ideia de post inspirada nas NOTÍCIAS e 1 inspirada nos CONCORRENTES, no SEU estilo. Regras: conecte ao que a marca faz; NUNCA copie a legenda do concorrente; legenda pronta em pt-BR, 1-3 frases, sem hashtags, sem travessão.${
    feedback ? ` Feedback do gestor pra melhorar: ${feedback}` : ""
  } Responda SOMENTE JSON: {"noticia":{"titulo":"","angulo":"","legenda":"","formato":"image|carousel|reel"},"concorrente":{"titulo":"","angulo":"","legenda":"","formato":"image|carousel|reel"}}.`;
  const parsed = (await chatJson(cfg, model, sys, signals)) as { noticia?: Idea; concorrente?: Idea } | null;
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
  let compPosts: CompetitorPost[] = [];
  if (acc && comps.length) {
    const batches = await Promise.all(comps.map((c) => competitorTopPosts(acc, c.value, 2)));
    compPosts = batches.flat().sort((a, b) => b.likes + b.comments - (a.likes + a.comments)).slice(0, 8);
  } else if (comps.length && !acc) {
    warnings.push("sem conta IG conectada pra ler concorrentes");
  }

  const signals = [
    rssItems.length
      ? `NOTÍCIAS:\n${rssItems.map((i) => `- ${i.title}`).join("\n")}`
      : "NOTÍCIAS: (nenhuma; use conhecimento do setor)",
    compPosts.length
      ? `CONCORRENTES (o que engajou; inspiração de tema, não copiar):\n${compPosts
          .map((p) => `- [${p.likes} curtidas, ${p.comments} coment.] ${(p.caption || "").replace(/\s+/g, " ").slice(0, 140)}`)
          .join("\n")}`
      : "CONCORRENTES: (sem dados; proponha com base no posicionamento da marca)",
  ].join("\n\n");

  const analysts =
    analystsRaw.length > 0
      ? analystsRaw
      : ([{ id: "", nome: "Analista", papel: "analista", tracos: "", instrucoes: "", modelo: "", skills: "", ativo: true }] as Persona[]);

  const results = (
    await Promise.all(analysts.map((a) => callAnalyst(cfg, a, brand, signals, feedback)))
  ).filter(Boolean) as { analista: string; noticia?: Idea; concorrente?: Idea }[];

  const noticias = results
    .map((r) => (r.noticia?.legenda ? { ...r.noticia, analista: r.analista } : null))
    .filter(Boolean) as Idea[];
  const concorrentes = results
    .map((r) => (r.concorrente?.legenda ? { ...r.concorrente, analista: r.analista } : null))
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
