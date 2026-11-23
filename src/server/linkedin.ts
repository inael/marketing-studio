// B15: publicar o texto do post na pagina da marca no LinkedIn (API de posts, ugcPosts).
// Imagem: por enquanto o texto e o link do post; upload de imagem entra com a API de assets.
export type LinkedinConta = { orgId: string; token: string };

export async function publicarLinkedin(conta: LinkedinConta, texto: string, fetcher: typeof fetch = fetch): Promise<{ ok: true; id: string } | { ok: false; motivo: string }> {
  const corpo = {
    author: `urn:li:organization:${conta.orgId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: texto.slice(0, 3000) },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  try {
    const r = await fetcher("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { Authorization: `Bearer ${conta.token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify(corpo),
    });
    const d = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok) {
      // 401/403: credencial. 429/5xx: transitorio (o job classifica pelo texto da mensagem)
      return { ok: false, motivo: `${r.status === 401 || r.status === 403 ? "token LinkedIn inválido ou sem permissão" : d.message ?? `LinkedIn respondeu ${r.status}`}` };
    }
    return { ok: true, id: String(d.id ?? "") };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? `timeout ou rede: ${e.message}` : "falha de rede" };
  }
}
