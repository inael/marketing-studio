import { sql } from "./db";
import { notificar } from "./notificacoes";
import { listAllBrands } from "./brands";

// B21: o token de longa duracao do Instagram dura ~60 dias. Renova quando faltam menos de 7.
export const RENOVAR_ANTES_DIAS = 7;

export async function renovarTokenIg(brandId: string, token: string): Promise<{ ok: true; token: string; expiraEm: string } | { ok: false; motivo: string }> {
  const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(process.env.META_APP_ID ?? "")}&client_secret=${encodeURIComponent(process.env.META_APP_SECRET ?? "")}&fb_exchange_token=${encodeURIComponent(token)}`;
  try {
    const r = await fetch(url);
    const d = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: { message?: string } };
    if (!r.ok || !d.access_token) return { ok: false, motivo: d.error?.message ?? `Meta respondeu ${r.status}` };
    const expiraEm = new Date(Date.now() + (d.expires_in ?? 5184000) * 1000).toISOString();
    await sql`update brands set ig_token = ${d.access_token}, ig_token_expira_em = ${expiraEm} where id = ${brandId}`;
    return { ok: true, token: d.access_token, expiraEm };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "falha de rede" };
  }
}

/** marcas com token perto do vencimento: renova; se falhar, avisa o time */
export async function renovarTokensVencendo(agora = new Date()) {
  const limite = agora.getTime() + RENOVAR_ANTES_DIAS * 86400000;
  let renovados = 0;
  let falhas = 0;
  for (const b of await listAllBrands()) {
    const expira = (b as unknown as { ig_token_expira_em?: string | null }).ig_token_expira_em;
    if (!b.ig_token || !expira || new Date(expira).getTime() > limite) continue;
    const r = await renovarTokenIg(b.id, b.ig_token);
    if (r.ok) renovados++;
    else {
      falhas++;
      await notificar({ tipo: "acao", titulo: `Token do Instagram de ${b.nome} vai vencer`, detalhe: `não renovou: ${r.motivo}. Reconecte a conta.`, href: `/marcas/${b.slug}/conectar` });
    }
  }
  return { renovados, falhas };
}
