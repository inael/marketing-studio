"use server";

import {
  getPost,
  setPostStatus,
  setPostMedia,
  setPostImagePrompt,
  softDeletePost,
} from "@/server/posts";
import { publishPost } from "@/server/publish";
import { hfGenerate } from "@/server/higgsfield";
import { saveRemoteMedia } from "@/server/media";
import { DEFAULT_IMAGE_MODEL } from "@/lib/models";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: true } | { ok: false; error: string };

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
  if (p.media.length === 0) {
    return { ok: false, error: "esse post ainda não tem imagem — gere a arte antes de aprovar" };
  }
  await setPostStatus(id, "approved", {});
  revalidatePath("/posts");
  return { ok: true };
}

export async function publishPostAction(id: string): Promise<ActionResult> {
  await requireAuth();
  const r = await publishPost(id);
  revalidatePath("/posts");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function removePost(id: string): Promise<ActionResult> {
  await requireAuth();
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

export async function savePostImagePrompt(id: string, prompt: string): Promise<ActionResult> {
  await requireAuth();
  await setPostImagePrompt(id, prompt.trim());
  revalidatePath("/posts");
  return { ok: true };
}
