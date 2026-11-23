"use server";

import {
  getPost,
  setPostStatus,
  setPostMedia,
  setPostImagePrompt,
  setPostLegenda,
  setPostSchedule,
  softDeletePost,
  createPost,
  listPosts,
} from "@/server/posts";
import { publishPost } from "@/server/publish";
import { getSettings, setSettings } from "@/server/settings";
import { exigirMarca, AcessoNegado, type Acao } from "@/server/permissoes";
import { transicionar } from "@/server/post-estado";
import { auditar } from "@/server/permissoes";
import { hfGenerate } from "@/server/higgsfield";
import { saveRemoteMedia } from "@/server/media";
import { DEFAULT_IMAGE_MODEL } from "@/lib/models";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

// B03: devolve o erro de permissao como resultado (a tela mostra a mensagem)
async function negadoSePreciso(brandId: string, acao: Acao, rota: string): Promise<ActionResult | null> {
  try {
    await exigirMarca(brandId, acao, rota);
    return null;
  } catch (e) {
    if (e instanceof AcessoNegado) return { ok: false, error: e.motivo };
    throw e;
  }
}

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
}

/**
 * Aprovar é só o sinal "essa peça pode ir ao ar" — não publica e não gera arte.
 * Post sem mídia é barrado aqui de propósito: o Instagram recusa publicação sem
 * imagem, então aprovar um rascunho vazio só empurraria a falha pro Publicar.
 */
export async function approvePost(id: string): Promise<ActionResult> {
  await requireAuth();
  const p = await getPost(id);
  if (!p) return { ok: false, error: "post não encontrado" };
  // B03: so o gestor da marca aprova
  const neg = await negadoSePreciso(p.brand_id, "aprovar", "approvePost");
  if (neg) return neg;
  if (p.media.length === 0) {
    return { ok: false, error: "esse post ainda não tem imagem — gere a arte antes de aprovar" };
  }
  // B10: a mudanca de estado passa pelo ponto unico (transicao valida, registro, conferencia)
  const t = await transicionar(id, "approved", null, "aprovado na fila");
  if (!t.ok) return { ok: false, error: t.motivo };
  revalidatePath("/posts");
  revalidatePath("/aprovacao");
  return { ok: true };
}

export async function publishPostAction(id: string): Promise<ActionResult> {
  await requireAuth();
  const alvo = await getPost(id);
  if (alvo) {
    const neg = await negadoSePreciso(alvo.brand_id, "publicar", "publishPostAction");
    if (neg) return neg;
  }
  const r = await publishPost(id);
  revalidatePath("/posts");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

// D11: adia a publicacao para o mesmo horario do dia seguinte
export async function postponePost(id: string): Promise<ActionResult> {
  await requireAuth();
  const p = await getPost(id);
  if (!p) return { ok: false, error: "post não encontrado" };
  const base = p.scheduled_at ? new Date(p.scheduled_at) : new Date();
  base.setDate(base.getDate() + 1);
  await setPostSchedule(id, base.toISOString());
  revalidatePath("/posts");
  revalidatePath("/aprovacao");
  return { ok: true };
}

// D09: salva a legenda editada no detalhe do post
export async function saveLegenda(id: string, legenda: string): Promise<ActionResult> {
  await requireAuth();
  if (legenda.length > 2200) return { ok: false, error: "legenda passou de 2.200 caracteres" };
  // D09: a versao anterior vai para o historico antes de trocar
  const atual = await getPost(id);
  if (atual?.legenda && atual.legenda !== legenda) {
    const s = await getSettings();
    let hist: string[] = [];
    try {
      hist = JSON.parse(s[`legenda.hist.${id}`] || "[]");
    } catch {
      hist = [];
    }
    await setSettings({ [`legenda.hist.${id}`]: JSON.stringify([atual.legenda, ...hist].slice(0, 10)) });
  }
  await setPostLegenda(id, legenda);
  revalidatePath("/posts");
  return { ok: true };
}

export async function removePost(id: string): Promise<ActionResult> {
  await requireAuth();
  const alvoAud = await getPost(id);
  if (alvoAud) await auditar("post.excluir", id, alvoAud.brand_id);
  await softDeletePost(id);
  revalidatePath("/posts");
  return { ok: true };
}

/**
 * Gera a arte do post a partir do prompt que o planner já escreveu (ou de um
 * prompt editado na hora) e anexa ao post. É o passo que faltava entre o
 * rascunho automático e o Aprovar.
 */
export async function generatePostImage(
  id: string,
  promptOverride?: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAuth();
  const post = await getPost(id);
  if (!post) return { ok: false, error: "post não encontrado" };

  const prompt = (promptOverride ?? post.imagem_prompt ?? "").trim();
  if (!prompt) return { ok: false, error: "escreva um prompt pra imagem antes de gerar" };
  if (prompt !== post.imagem_prompt) await setPostImagePrompt(id, prompt);

  const r = await hfGenerate(DEFAULT_IMAGE_MODEL, {
    prompt,
    aspect_ratio: post.tipo === "reel" ? "9:16" : "1:1",
    resolution: "1080p",
  });
  if (r.error || !r.imageUrl) return { ok: false, error: r.error ?? "a IA não devolveu imagem" };

  const url = await saveRemoteMedia(r.imageUrl, post.brand_id, "higgsfield");
  // carrossel acumula; imagem/reel tem uma peça só
  await setPostMedia(id, post.tipo === "carousel" ? [...post.media, url] : [url]);
  revalidatePath("/posts");
  return { ok: true, url };
}

// D09: historico de versoes da legenda (mais recente primeiro, no app_settings)
export async function historicoLegenda(id: string): Promise<string[]> {
  await requireAuth();
  const s = await getSettings();
  try {
    const v = JSON.parse(s[`legenda.hist.${id}`] || "[]");
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

// M41: comentarios de revisao presos a um trecho da legenda
export type ComentarioTrecho = { trecho: string; texto: string; resolvido: boolean; quando: string };

export async function listarComentarios(id: string): Promise<ComentarioTrecho[]> {
  await requireAuth();
  const s = await getSettings();
  try {
    const v = JSON.parse(s[`comentarios.${id}`] || "[]");
    return Array.isArray(v) ? (v as ComentarioTrecho[]) : [];
  } catch {
    return [];
  }
}

export async function comentarTrecho(id: string, trecho: string, texto: string): Promise<ActionResult> {
  await requireAuth();
  if (!trecho.trim() || !texto.trim()) return { ok: false, error: "selecione um trecho e escreva o comentário" };
  const lista = await listarComentarios(id);
  const novo: ComentarioTrecho = { trecho: trecho.trim(), texto: texto.trim(), resolvido: false, quando: new Date().toISOString() };
  await setSettings({ [`comentarios.${id}`]: JSON.stringify([novo, ...lista].slice(0, 50)) });
  return { ok: true };
}

export async function resolverComentario(id: string, quando: string): Promise<ActionResult> {
  await requireAuth();
  const lista = await listarComentarios(id);
  const ajustada = lista.map((c) => (c.quando === quando ? { ...c, resolvido: true } : c));
  await setSettings({ [`comentarios.${id}`]: JSON.stringify(ajustada) });
  return { ok: true };
}

// M42: duplica o post como rascunho novo, sem data. Mostra quantos parecidos ja existem.
export async function duplicarPost(id: string): Promise<{ ok: true; novoId: string; parecidos: number } | { ok: false; error: string }> {
  await requireAuth();
  const p = await getPost(id);
  if (!p) return { ok: false, error: "post não encontrado" };
  const todos = await listPosts();
  const parecidos = todos.filter((x) => !x.deleted_at && x.id !== p.id && x.legenda.trim() === p.legenda.trim()).length;
  const copia = await createPost({
    brand_id: p.brand_id,
    tipo: p.tipo,
    formato: p.formato,
    legenda: p.legenda,
    hashtags: p.hashtags,
    media: p.media,
    status: "draft",
    scheduled_at: null,
    origem: "manual",
    analista: p.analista,
    fonte_tipo: p.fonte_tipo,
    fonte_url: p.fonte_url,
    fonte_label: p.fonte_label,
    imagem_prompt: p.imagem_prompt,
  });
  revalidatePath("/posts");
  return { ok: true, novoId: copia.id, parecidos };
}

// M47: grava a nova ordem dos slides de um carrossel
export async function reordenarMidiaPost(id: string, urls: string[]): Promise<ActionResult> {
  await requireAuth();
  await setPostMedia(id, urls);
  revalidatePath("/posts");
  return { ok: true };
}

// D09: versao do post por rede (texto proprio de cada uma)
export async function versoesDaRede(id: string): Promise<Record<string, string>> {
  await requireAuth();
  const s = await getSettings();
  const out: Record<string, string> = {};
  for (const r of ["instagram", "linkedin", "x"]) {
    const v = s[`versao.${r}.${id}`];
    if (v) out[r] = v;
  }
  return out;
}

export async function salvarVersaoRede(id: string, rede: string, texto: string): Promise<ActionResult> {
  await requireAuth();
  if (!["instagram", "linkedin", "x"].includes(rede)) return { ok: false, error: "rede inválida" };
  await setSettings({ [`versao.${rede}.${id}`]: texto });
  revalidatePath("/posts");
  return { ok: true };
}
