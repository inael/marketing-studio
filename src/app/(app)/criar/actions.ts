"use server";

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createPost } from "@/server/posts";
import { publishPost } from "@/server/publish";
import { revalidatePath } from "next/cache";

export type CreateInput = {
  brand_id: string;
  tipo: "image" | "carousel" | "reel";
  formato: string;
  legenda: string;
  hashtags: string[];
  media: string[];
  mode: "rascunho" | "agendar" | "publicar";
  scheduled_at: string | null;
};

export async function createPostAction(
  input: CreateInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };

  const status =
    input.mode === "agendar" ? "scheduled" : input.mode === "publicar" ? "approved" : "draft";

  try {
    const post = await createPost({
      brand_id: input.brand_id,
      tipo: input.tipo,
      formato: input.formato,
      legenda: input.legenda,
      hashtags: input.hashtags,
      media: input.media,
      scheduled_at: input.mode === "agendar" ? input.scheduled_at : null,
      status,
    });

    if (input.mode === "publicar") {
      const r = await publishPost(post.id);
      if (!r.ok) {
        return { ok: false, error: `Post criado, mas falhou ao publicar: ${r.error}` };
      }
    }

    revalidatePath("/posts");
    revalidatePath("/calendario");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro ao criar post" };
  }
}
