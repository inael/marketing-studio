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
