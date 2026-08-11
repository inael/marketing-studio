"use server";

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createPost } from "@/server/posts";
import { revalidatePath } from "next/cache";

// Cria um rascunho a partir dos frames aprovados do storyboard.
export async function createStoryboardDraft(input: {
  brand_id: string;
  media: string[];
  legenda: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };
  if (!input.media.length) return { ok: false, error: "gere ao menos um frame antes" };

  try {
    await createPost({
      brand_id: input.brand_id,
      tipo: input.media.length > 1 ? "carousel" : "image",
      formato: "sem_personagem",
      legenda: input.legenda,
      hashtags: [],
      media: input.media,
      status: "draft",
    });
    revalidatePath("/posts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro ao criar rascunho" };
  }
}

async function createTyped(
  brand_id: string,
  tipo: "reel" | "story",
  url: string,
  legenda: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };
  if (!url) return { ok: false, error: "gere a mídia dessa cena antes" };
  try {
    await createPost({
      brand_id,
      tipo,
      formato: "sem_personagem",
      legenda: tipo === "story" ? "" : legenda,
      hashtags: [],
      media: [url],
      status: "draft",
    });
    revalidatePath("/posts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro ao criar rascunho" };
  }
}

export async function createStoryboardReel(input: {
  brand_id: string;
  video: string;
  legenda: string;
}) {
  return createTyped(input.brand_id, "reel", input.video, input.legenda);
}

export async function createStoryboardStory(input: {
  brand_id: string;
  url: string;
  legenda: string;
}) {
  return createTyped(input.brand_id, "story", input.url, input.legenda);
}
