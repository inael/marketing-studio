import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { getBrandById, type Brand } from "@/server/brands";
import { listSources } from "@/server/sources";
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
  // fallback: qualquer conta business serve pra business_discovery
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

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const cfg = await getAiConfig();
  if (!cfg) return NextResponse.json({ error: "IA de texto não configurada em Config." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { brand_id?: string; n?: number };
  const brand = body.brand_id ? await getBrandById(body.brand_id) : null;
  if (!brand) return NextResponse.json({ error: "marca inválida" }, { status: 400 });
  const n = Math.min(Math.max(Number(body.n) || 5, 1), 8);

  const sources = await listSources(brand.id);
  const rssUrls = sources.filter((s) => s.kind === "rss").slice(0, 3);
  const comps = sources.filter((s) => s.kind === "competitor").slice(0, 5);

  const [rssBatches, acc] = [
    await Promise.all(rssUrls.map((s) => fetchRss(s.value))),
    resolveIg(brand),
  ];
  const rssItems: RssItem[] = rssBatches.flat().slice(0, 12);

  let compPosts: CompetitorPost[] = [];
  const compErrors: string[] = [];
  if (acc && comps.length) {
    const batches = await Promise.all(comps.map((c) => competitorTopPosts(acc, c.value, 2)));
    compPosts = batches.flat().sort((a, b) => b.likes + b.comments - (a.likes + a.comments)).slice(0, 8);
  } else if (comps.length && !acc) {
    compErrors.push("sem conta IG conectada pra ler concorrentes");
  }

  const sys = `Você é estrategista de conteúdo da ${brand.nome} (${brand.site_url}). A partir dos SINAIS (notícias recentes e o que mais engajou nos concorrentes), proponha ${n} ideias de post ORIGINAIS no tom de voz da marca: ${
    brand.tom_voz || "profissional e claro"
  }. Regras: NUNCA copie a legenda do concorrente (use só como inspiração de tema/ângulo); traga ideias úteis e específicas; legenda pronta em pt-BR, 1-3 frases, sem hashtags, sem travessão. Responda SOMENTE JSON: {"suggestions":[{"titulo":"curto","angulo":"por que postar isso agora","legenda":"legenda pronta","formato":"image|carousel|reel","fonte":"de onde veio a ideia"}]}.`;

  const user = [
    rssItems.length ? `NOTÍCIAS:\n${rssItems.map((i) => `- ${i.title}`).join("\n")}` : "",
    compPosts.length
      ? `CONCORRENTES (o que engajou; inspiração de tema, não copiar):\n${compPosts
          .map((p) => `- [${p.likes} curtidas, ${p.comments} coment.] ${(p.caption || "").replace(/\s+/g, " ").slice(0, 140)}`)
          .join("\n")}`
      : "",
    !rssItems.length && !compPosts.length
      ? "Sem sinais externos disponíveis; proponha ideias fortes baseadas no que a marca faz."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const r = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.85,
        max_tokens: 1400,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ error: data?.error?.message ?? `provedor retornou ${r.status}` }, { status: 502 });
    }
    const content = String(data?.choices?.[0]?.message?.content ?? "");
    const parsed = extractJson(content) as { suggestions?: unknown[] } | null;
    const suggestions = parsed?.suggestions;
    if (!Array.isArray(suggestions) || !suggestions.length) {
      return NextResponse.json({ error: "não consegui montar as sugestões, tente de novo" }, { status: 502 });
    }
    return NextResponse.json({
      suggestions,
      meta: { rss: rssItems.length, competitors: compPosts.length, warnings: compErrors },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "falha ao sugerir" }, { status: 502 });
  }
}
