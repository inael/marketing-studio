import { getHiggsfield } from "./settings";

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
    if (!res.ok) {
      return { error: data?.error ?? data?.message ?? `Higgsfield retornou ${res.status}` };
    }

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
