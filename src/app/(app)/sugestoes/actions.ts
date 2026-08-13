"use server";

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createPost, type Post } from "@/server/posts";
import { revalidatePath } from "next/cache";

export async function createDraftFromSuggestion(input: {
  brand_id: string;
  legenda: string;
  tipo: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };

  const tipo: Post["tipo"] = (["image", "carousel", "reel", "story"] as const).includes(
    input.tipo as Post["tipo"]
  )
    ? (input.tipo as Post["tipo"])
    : "image";

  try {
    await createPost({
      brand_id: input.brand_id,
      tipo,
      formato: "sem_personagem",
      legenda: input.legenda,
      hashtags: [],
      media: [],
      status: "draft",
    });
    revalidatePath("/posts");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro ao criar rascunho" };
  }
}
