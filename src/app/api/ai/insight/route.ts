import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { getBrandById } from "@/server/brands";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Insight prático da IA pra uma métrica (perfil vs média do mercado).
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const cfg = await getAiConfig();
  if (!cfg) return NextResponse.json({ error: "IA de texto não configurada em Config." }, { status: 400 });

  const b = (await req.json().catch(() => ({}))) as {
    brand_id?: string;
    metrica?: string;
    self?: number;
    market?: number;
  };
  const brand = b.brand_id ? await getBrandById(b.brand_id) : null;
  if (!brand || !b.metrica) return NextResponse.json({ error: "dados inválidos" }, { status: 400 });

  const sys = `Você é consultor de marketing de conteúdo da ${brand.nome} (${brand.site_url}). Fale direto com o gestor, em pt-BR, 2 a 3 frases práticas, sem travessão, sem enrolação. Foque em o que fazer pra melhorar a métrica.`;
  const user = `Métrica: ${b.metrica}. Nosso valor: ${b.self}. Média do mercado (concorrentes): ${b.market}. Dê uma recomendação prática e específica pra essa métrica.`;

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
        temperature: 0.7,
        max_tokens: 220,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: data?.error?.message ?? `provedor ${r.status}` }, { status: 502 });
    const insight = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!insight) return NextResponse.json({ error: "sem resposta" }, { status: 502 });
    return NextResponse.json({ insight });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "falha na IA" }, { status: 502 });
  }
}
