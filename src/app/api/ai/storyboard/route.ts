import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { getBrandById } from "@/server/brands";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export type Scene = {
  titulo: string;
  cena: string; // prompt visual pra gerar o frame
  narracao: string; // fala em pt-BR
  movimento: string; // motion prompt pro vídeo
};

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
  if (!cfg) {
    return NextResponse.json(
      { error: "IA de texto não configurada. Vá em Config." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    brand_id?: string;
    brief?: string;
    n?: number;
  };
  const brand = body.brand_id ? await getBrandById(body.brand_id) : null;
  if (!brand) return NextResponse.json({ error: "marca inválida" }, { status: 400 });
  const brief = body.brief?.trim();
  if (!brief) return NextResponse.json({ error: "escreva a ideia do vídeo" }, { status: 400 });
  const n = Math.min(Math.max(Number(body.n) || 4, 2), 8);

  const sys = `Você é diretor de conteúdo da ${brand.nome} (${brand.site_url}). Quebre a ideia em exatamente ${n} cenas para um vídeo vertical curto (reel de Instagram), no tom de voz da marca: ${
    brand.tom_voz || "profissional e claro"
  }. Responda SOMENTE um JSON válido, sem texto fora dele, no formato: {"scenes":[{"titulo":"curto","cena":"descrição visual detalhada da cena para gerar a imagem (pode ser em inglês, cite estilo/enquadramento/luz)","narracao":"fala curta em português do Brasil","movimento":"motion prompt curto em inglês para animar a imagem (ex: slow zoom in, camera pans left)"}]}.`;
  const user = `Ideia/roteiro: ${brief}`;

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
        temperature: 0.8,
        max_tokens: 1200,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? `provedor retornou ${r.status}` },
        { status: 502 }
      );
    }
    const content = String(data?.choices?.[0]?.message?.content ?? "");
    const parsed = extractJson(content) as { scenes?: Scene[] } | null;
    const scenes = parsed?.scenes;
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: "não consegui montar as cenas, tente de novo" }, { status: 502 });
    }
    return NextResponse.json({ scenes });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha ao gerar storyboard" },
      { status: 502 }
    );
  }
}
