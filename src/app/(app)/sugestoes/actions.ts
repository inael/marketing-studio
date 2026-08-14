"use server";

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createPost, type Post } from "@/server/posts";
import {
  getSuggestion,
  markAccepted,
  deleteSuggestion,
  deleteSuggestions,
  clearSuggestions,
  updateSuggestion,
} from "@/server/suggestions";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  return isAuthenticated;
}

/** Aceita uma sugestão salva: vira rascunho carregando analista + fonte + prompt de imagem. */
export async function acceptSuggestion(
  suggestionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await requireAuth())) return { ok: false, error: "sessão expirada, faça login de novo" };

  const s = await getSuggestion(suggestionId);
  if (!s) return { ok: false, error: "sugestão não encontrada" };

  const tipo: Post["tipo"] = (["image", "carousel", "reel", "story"] as const).includes(
    s.formato as Post["tipo"]
  )
    ? (s.formato as Post["tipo"])
    : "image";

  try {
    await createPost({
      brand_id: s.brand_id,
      tipo,
      formato: "sem_personagem",
      legenda: s.legenda,
      hashtags: s.hashtags ?? [],
      media: [],
      status: "draft",
      analista: s.analista,
      fonte_tipo: s.grupo,
      fonte_url: s.ref_url,
      fonte_label: s.ref_label,
      imagem_prompt: s.imagem_prompt,
    });
    await markAccepted(suggestionId);
    revalidatePath("/posts");
    revalidatePath("/sugestoes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro ao criar rascunho" };
  }
}

export async function updateSuggestionAction(
  id: string,
  patch: { legenda?: string; imagem_prompt?: string; hashtags?: string[] }
): Promise<{ ok: boolean }> {
  if (!(await requireAuth())) return { ok: false };
  await updateSuggestion(id, patch);
  revalidatePath("/sugestoes");
  return { ok: true };
}

export async function dismissSuggestion(id: string): Promise<{ ok: boolean }> {
  if (!(await requireAuth())) return { ok: false };
  await deleteSuggestion(id);
  revalidatePath("/sugestoes");
  return { ok: true };
}

export async function dismissSuggestions(ids: string[]): Promise<{ ok: boolean }> {
  if (!(await requireAuth())) return { ok: false };
  await deleteSuggestions(ids);
  revalidatePath("/sugestoes");
  return { ok: true };
}

export async function clearBrandSuggestions(brandId?: string): Promise<{ ok: boolean }> {
  if (!(await requireAuth())) return { ok: false };
  await clearSuggestions(brandId);
  revalidatePath("/sugestoes");
  return { ok: true };
}
