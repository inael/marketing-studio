import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig, getAiConfigReserva } from "@/server/settings";
import { getBrandById } from "@/server/brands";
import { logUsage, usageFrom } from "@/server/usage";
import { checarLimite } from "@/lib/limite";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Gera/reescreve a legenda no tom de voz da marca via provedor OpenAI-compatível
// (UseTokia ou LiteLLM), configurado em /config.
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // B45: ate 20 legendas por minuto por usuario
  const quem = (await getLogtoContext(logtoConfig)).claims?.sub ?? "anon";
  const lim = checarLimite(`caption:${quem}`, 20, 60000);
  if (!lim.ok) return NextResponse.json({ error: `muitas gerações seguidas: tente de novo em ${lim.esperarS}s`, esperarS: lim.esperarS }, { status: 429 });

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
    tom?: string;
    tamanho?: string;
    template?: string;
    assunto?: string;
    segmento?: string;
    stream?: boolean;
  };
  const brand = body.brand_id ? await getBrandById(body.brand_id) : null;
  if (!brand) {
    return NextResponse.json({ error: "marca inválida" }, { status: 400 });
  }

  const TOM: Record<string, string> = {
    direto: "direto e objetivo, sem rodeios",
    casual: "casual e descontraído, como uma conversa",
    persuasivo: "persuasivo, com foco em conversão e prova de valor",
    alegre: "alegre e animado, com energia positiva",
    amigavel: "amigável e acolhedor, próximo do público",
    didatico: "didático e explicativo, passo a passo e com exemplo",
  };
  const TAMANHO: Record<string, { desc: string; tokens: number }> = {
    curta: { desc: "1 frase curta e impactante", tokens: 140 },
    media: { desc: "2 a 3 frases", tokens: 320 },
    longa: { desc: "4 a 6 frases com um pequeno desenvolvimento", tokens: 650 },
  };
  const tomTxt = body.tom ? TOM[body.tom] ?? body.tom : brand.tom_voz || "profissional, claro e direto";
  const tam = TAMANHO[body.tamanho ?? "media"] ?? TAMANHO.media;

  const sys = `Você é redator de social media da ${brand.nome} (${brand.site_url}).${
    body.segmento ? ` Segmento/categoria do perfil: ${body.segmento}.` : ""
  } Escreva legendas de Instagram em português do Brasil. Tom de voz: ${tomTxt}. Tamanho: ${
    tam.desc
  }. Regras: no máximo 1 emoji (ou nenhum); NÃO inclua hashtags (vão em campo separado); nunca use travessão (—); termine com um CTA leve. Responda apenas com a legenda, sem aspas nem rótulos.`;

  // template de pauta ("Aponte os benefícios de") + assunto ("usar a JetSend")
  const briefing = [body.template?.trim(), body.assunto?.trim()].filter(Boolean).join(" ").trim();

  const user = [
    body.tipo ? `Tipo de post: ${body.tipo}.` : "",
    briefing ? `Pauta: ${briefing}.` : body.tema ? `Tema/briefing: ${body.tema}.` : "",
    body.atual?.trim()
      ? `Reescreva e melhore a partir deste rascunho: "${body.atual.trim()}".`
      : "Crie uma legenda nova e envolvente sobre a pauta acima.",
  ]
    .filter(Boolean)
    .join("\n");

  // B07: modo em partes. O texto chega conforme e, no fim, um marcador (\u0001) diz se terminou.
  if (body.stream) {
    return streamDoProvedor(cfg, {
      model: cfg.model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: tam.tokens,
    }, brand.id);
  }

  try {
    const chamar = (c: { baseUrl: string; apiKey: string; model: string }) => fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
        max_tokens: tam.tokens,
      }),
    });
    let r = await chamar(cfg);
    // B38: falha transitoria no principal (rede, 5xx ou limite): tenta o provedor de reserva uma vez
    if (r.status >= 500 || r.status === 429) {
      const alt = await getAiConfigReserva();
      if (alt) r = await chamar(alt);
    }
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
    await logUsage({ persona: null, tipo: "legenda", model: cfg.model, brand_id: brand.id, ...usageFrom(data) });
    return NextResponse.json({ caption });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha ao chamar a IA" },
      { status: 502 }
    );
  }
}

// B07: repassa o texto do provedor conforme chega. Limite de 30 s; se cair no meio,
// manda o que ja chegou (parcial) com o motivo, para a tela guardar como rascunho.
function streamDoProvedor(cfg: { baseUrl: string; apiKey: string; model: string }, payload: Record<string, unknown>, brandId: string): Response {
  const enc = new TextEncoder();
  const ctrl = new AbortController();
  const limite = setTimeout(() => ctrl.abort(), 30000);
  const stream = new ReadableStream({
    async start(controller) {
      let texto = "";
      let usage: unknown = undefined;
      try {
        const r = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({ ...payload, stream: true, stream_options: { include_usage: true } }),
          signal: ctrl.signal,
        });
        if (!r.ok || !r.body) throw new Error(`provedor retornou ${r.status}`);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) >= 0) {
            const linha = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!linha.startsWith("data:")) continue;
            const dados = linha.slice(5).trim();
            if (!dados || dados === "[DONE]") continue;
            try {
              const j = JSON.parse(dados);
              if (j.usage) usage = j.usage;
              const d = String(j?.choices?.[0]?.delta?.content ?? "");
              if (d) {
                texto += d;
                controller.enqueue(enc.encode(d));
              }
            } catch {
              // linha que nao e JSON completo: ignora
            }
          }
        }
        const final = texto.trim();
        if (!final) throw new Error("provedor não retornou texto");
        await logUsage({ persona: null, tipo: "legenda", model: cfg.model, brand_id: brandId, ...usageFrom({ usage }) });
        controller.enqueue(enc.encode("\u0001" + JSON.stringify({ ok: true, texto: final })));
      } catch (e) {
        const motivo = ctrl.signal.aborted ? "tempo esgotado (30 s)" : e instanceof Error ? e.message : "falha na IA";
        controller.enqueue(enc.encode("\u0001" + JSON.stringify({ ok: false, motivo, parcial: texto.trim() })));
      } finally {
        clearTimeout(limite);
        controller.close();
      }
    },
    cancel() {
      ctrl.abort();
      clearTimeout(limite);
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
