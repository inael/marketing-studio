import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { getBrandById } from "@/server/brands";
import { getManager } from "@/server/personas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type Sug = { titulo?: string; legenda?: string; analista?: string; formato?: string };

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

  const body = (await req.json().catch(() => ({}))) as {
    brand_id?: string;
    noticias?: Sug[];
    concorrentes?: Sug[];
  };
  const brand = body.brand_id ? await getBrandById(body.brand_id) : null;
  if (!brand) return NextResponse.json({ error: "marca inválida" }, { status: 400 });

  const all: Sug[] = [...(body.noticias ?? []), ...(body.concorrentes ?? [])];
  if (!all.length) return NextResponse.json({ error: "não há sugestões pra revisar" }, { status: 400 });

  const manager = await getManager();
  const persona = manager ? `${manager.nome} — ${manager.instrucoes}` : "gestora de mídias sociais experiente";

  const sys = `Você é ${persona}. Gestora de mídias sociais da ${brand.nome} (${brand.site_url}), tom de voz: ${
    brand.tom_voz || "profissional e claro"
  }. Revise as sugestões do time abaixo e faça o que uma gestora faria: escolha as 2-3 MELHORES pra publicar (pense em consistência de marca, relevância e resultado), diga por quê, sugira ajustes concretos nas legendas, e dê um feedback objetivo pro time melhorar no próximo ciclo. Responda SOMENTE JSON: {"escolhas":[{"titulo":"","por_que":""}],"ajustes":"","feedback_time":""}.`;

  const user = all
    .map((s, i) => `${i + 1}. [${s.analista ?? "?"}] ${s.titulo ?? ""} — ${(s.legenda ?? "").replace(/\s+/g, " ").slice(0, 160)}`)
    .join("\n");

  try {
    const r = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: manager?.modelo || cfg.model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_tokens: 900,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ error: data?.error?.message ?? `provedor retornou ${r.status}` }, { status: 502 });
    }
    const parsed = extractJson(String(data?.choices?.[0]?.message?.content ?? "")) as {
      escolhas?: unknown[];
      ajustes?: string;
      feedback_time?: string;
    } | null;
    if (!parsed) return NextResponse.json({ error: "não consegui ler a resposta do gestor" }, { status: 502 });

    return NextResponse.json({
      gestor: manager?.nome ?? "Gestor",
      escolhas: Array.isArray(parsed.escolhas) ? parsed.escolhas : [],
      ajustes: parsed.ajustes ?? "",
      feedback_time: parsed.feedback_time ?? "",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "falha do gestor" }, { status: 502 });
  }
}
