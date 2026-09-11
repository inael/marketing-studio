import { getHiggsfield } from "./settings";

/**
 * Traduz o erro da Higgsfield pra uma frase que diz o que fazer.
 *
 * A API devolve o motivo em `detail` — string nos erros de conta
 * (`not_enough_credits`, `Invalid credentials`) e array de campos no 422 de
 * validação. Antes só líamos `error`/`message`, que ela nunca manda: sem
 * créditos, o usuário via "Higgsfield retornou 403" e não tinha como saber que
 * bastava fazer top-up.
 */
export function hfError(status: number, data: unknown): string {
  const d = (data ?? {}) as { detail?: unknown; error?: string; message?: string };

  const detalhe = Array.isArray(d.detail)
    ? (d.detail as { loc?: unknown[]; msg?: string }[])
        .map((e) => `${e.loc?.slice(1).join(".") ?? "campo"}: ${e.msg ?? "inválido"}`)
        .join("; ")
    : typeof d.detail === "string"
      ? d.detail
      : undefined;

  const cru = detalhe ?? d.error ?? d.message;

  if (cru === "not_enough_credits") {
    return "Sem créditos na Higgsfield. Faça top-up em platform.higgsfield.ai pra gerar imagem pelo app — enquanto isso dá pra subir a arte à mão em Criar.";
  }
  if (status === 401) {
    return "Credenciais da Higgsfield recusadas (401). Confira a API key e o secret em Config.";
  }
  return cru ? `Higgsfield: ${cru}` : `Higgsfield retornou ${status}`;
}

// Chamada unificada à Higgsfield (assíncrona: submete -> polling -> resultado).
// Serve tanto pra imagem (retorna imageUrl) quanto vídeo (retorna videoUrl).
export async function hfGenerate(
  model: string,
  payload: Record<string, unknown>,
  timeoutMs = 55_000
): Promise<{ imageUrl?: string; videoUrl?: string; error?: string }> {
  const cfg = await getHiggsfield();
  if (!cfg) return { error: "Higgsfield não configurado (key + secret) em Config." };

  const auth = `Key ${cfg.apiKey}:${cfg.apiSecret}`;
  const base = "https://platform.higgsfield.ai";

  try {
    let res = await fetch(`${base}/${model}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    let data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: hfError(res.status, data) };

    let imageUrl: string | undefined = data?.images?.[0]?.url;
    let videoUrl: string | undefined = data?.video?.url;
    const statusUrl: string | undefined = data?.status_url;
    const deadline = Date.now() + timeoutMs;

    while (!imageUrl && !videoUrl && statusUrl && data?.status !== "failed" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      res = await fetch(statusUrl, { headers: { Authorization: auth, Accept: "application/json" } });
      data = await res.json().catch(() => ({}));
      if (data?.status === "completed") {
        imageUrl = data?.images?.[0]?.url;
        videoUrl = data?.video?.url;
      }
    }

    if (!imageUrl && !videoUrl) {
      return { error: data?.status === "failed" ? "geração falhou" : "geração demorou, tente de novo" };
    }
    return { imageUrl, videoUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "falha ao chamar Higgsfield" };
  }
}
