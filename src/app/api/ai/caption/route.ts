import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { getBrandById } from "@/server/brands";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Gera/reescreve a legenda no tom de voz da marca via provedor OpenAI-compatível
// (UseTokia ou LiteLLM), configurado em /config.
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const cfg = await getAiConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "IA de texto não configurada. Vá em Config e preencha o provedor." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    brand_id?: string;
    tema?: string;
    atual?: string;
    tipo?: string;
  };
  const brand = body.brand_id ? await getBrandById(body.brand_id) : null;
  if (!brand) {
    return NextResponse.json({ error: "marca inválida" }, { status: 400 });
  }

  const sys = `Você é redator de social media da ${brand.nome} (${brand.site_url}). Escreva legendas de Instagram em português do Brasil no tom de voz da marca: ${
    brand.tom_voz || "profissional, claro e direto"
  }. Regras: 1 a 3 frases curtas; no máximo 1 emoji (ou nenhum); NÃO inclua hashtags (vão em campo separado); nunca use travessão (—); termine com um CTA leve. Responda apenas com a legenda, sem aspas nem rótulos.`;

  const user = [
    body.tipo ? `Tipo de post: ${body.tipo}.` : "",
    body.tema ? `Tema/briefing: ${body.tema}.` : "",
    body.atual?.trim()
      ? `Reescreva e melhore a partir deste rascunho: "${body.atual.trim()}".`
      : "Crie uma legenda nova e envolvente.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const r = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? `provedor retornou ${r.status}` },
        { status: 502 }
      );
    }
    const caption = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!caption) {
      return NextResponse.json({ error: "provedor não retornou texto" }, { status: 502 });
    }
    return NextResponse.json({ caption });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha ao chamar a IA" },
      { status: 502 }
    );
  }
}
