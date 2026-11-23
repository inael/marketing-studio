"use server";

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createPost, postPorIdempotencia } from "@/server/posts";
import { publishPost } from "@/server/publish";
import { nextOpenSlot } from "@/server/timeslots";
import { getBrandById } from "@/server/brands";
import { localParaUtc } from "@/lib/fuso";
import { revalidatePath } from "next/cache";

export type CreateInput = {
  brand_id: string;
  tipo: "image" | "carousel" | "reel";
  formato: string;
  legenda: string;
  hashtags: string[];
  media: string[];
  mode: "rascunho" | "agendar" | "auto" | "publicar";
  scheduled_at: string | null;
  // B04: chave gerada ao abrir o formulario; reenvio com a mesma chave devolve o post existente
  idem?: string;
};

export async function createPostAction(
  input: CreateInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };

  const status =
    input.mode === "agendar" || input.mode === "auto"
      ? "scheduled"
      : input.mode === "publicar"
        ? "approved"
        : "draft";

  let scheduled_at = input.mode === "agendar" ? input.scheduled_at : null;
  // B09: o horario escolhido e local da marca; vira UTC antes de gravar
  if (input.mode === "agendar") {
    const marca = await getBrandById(input.brand_id);
    const tz = marca?.timezone || "America/Sao_Paulo";
    const conv = localParaUtc(input.scheduled_at ?? "", tz);
    if (!conv.ok) return { ok: false, error: conv.sugestao ? `${conv.motivo}. Tente ${conv.sugestao}` : conv.motivo };
    if (new Date(conv.iso).getTime() < Date.now() - 60000) return { ok: false, error: "esse horário já passou" };
    scheduled_at = conv.iso;
  }
  if (input.mode === "auto") {
    const slot = await nextOpenSlot(input.brand_id);
    if (!slot) {
      return {
        ok: false,
        error: "Sem horários fixos pra essa marca. Defina em Marcas > Horários fixos.",
      };
    }
    scheduled_at = slot.toISOString();
  }

  // B04: se a mesma intencao ja virou post, devolve o existente sem criar outro
  if (input.idem) {
    const ja = await postPorIdempotencia(input.idem);
    if (ja) return { ok: true };
  }

  try {
    const post = await createPost({
      idempotency_key: input.idem ?? null,
      brand_id: input.brand_id,
      tipo: input.tipo,
      formato: input.formato,
      legenda: input.legenda,
      hashtags: input.hashtags,
      media: input.media,
      scheduled_at,
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
    // corrida: dois envios com a mesma chave; o segundo encontra o primeiro
    if (input.idem && (await postPorIdempotencia(input.idem))) return { ok: true };
    return { ok: false, error: e instanceof Error ? e.message : "erro ao criar post" };
  }
}
