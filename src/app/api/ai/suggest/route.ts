import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig, type AiConfig } from "@/server/settings";
import { getBrandById, type Brand } from "@/server/brands";
import { listSources } from "@/server/sources";
import { listAnalysts, type Persona } from "@/server/personas";
import { fetchRss, competitorTopPosts, type CompetitorPost, type RssItem } from "@/server/signals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function resolveIg(brand: Brand): { igUserId: string; token: string } | null {
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

type Idea = { titulo?: string; angulo?: string; legenda?: string; formato?: string; analista?: string };

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

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const cfg = await getAiConfig();
  if (!cfg) return NextResponse.json({ error: "IA de texto não configurada em Config." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { brand_id?: string; feedback?: string };
  const brand = body.brand_id ? await getBrandById(body.brand_id) : null;
  if (!brand) return NextResponse.json({ error: "marca inválida" }, { status: 400 });

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
    rssItems.length ? `NOTÍCIAS:\n${rssItems.map((i) => `- ${i.title}`).join("\n")}` : "NOTÍCIAS: (nenhuma; use conhecimento do setor)",
    compPosts.length
      ? `CONCORRENTES (o que engajou; inspiração de tema, não copiar):\n${compPosts
          .map((p) => `- [${p.likes} curtidas, ${p.comments} coment.] ${(p.caption || "").replace(/\s+/g, " ").slice(0, 140)}`)
          .join("\n")}`
      : "CONCORRENTES: (sem dados; proponha com base no posicionamento da marca)",
  ].join("\n\n");

  // Cada analista é um agente com seu próprio modelo/skills (chamados em paralelo)
  const analysts =
    analystsRaw.length > 0
      ? analystsRaw
      : ([{ id: "", nome: "Analista", papel: "analista", tracos: "", instrucoes: "", modelo: "", skills: "", ativo: true }] as Persona[]);

  const results = (await Promise.all(analysts.map((a) => callAnalyst(cfg, a, brand, signals, body.feedback)))).filter(
    Boolean
  ) as { analista: string; noticia?: Idea; concorrente?: Idea }[];

  const noticias = results.map((r) => (r.noticia?.legenda ? { ...r.noticia, analista: r.analista } : null)).filter(Boolean);
  const concorrentes = results
    .map((r) => (r.concorrente?.legenda ? { ...r.concorrente, analista: r.analista } : null))
    .filter(Boolean);

  if (!noticias.length && !concorrentes.length) {
    return NextResponse.json({ error: "o time não conseguiu montar sugestões, tente de novo" }, { status: 502 });
  }

  return NextResponse.json({
    noticias,
    concorrentes,
    analysts: analysts.map((a) => ({ nome: a.nome, modelo: a.modelo || cfg.model })),
    meta: { rss: rssItems.length, competitors: compPosts.length, warnings },
  });
}
