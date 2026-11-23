"use server";

import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { setPostSchedule, setPostStatus } from "@/server/posts";
import { exigirMarca, AcessoNegado } from "@/server/permissoes";

// D15: agenda uma serie de rascunhos, cada um na data escolhida (o horario ja vem em ISO)
export async function agendarSerie(
  brandId: string,
  itens: { id: string; quando: string }[],
): Promise<{ ok: true; agendados: number } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };
  try {
    await exigirMarca(brandId, "editar", "agendarSerie");
  } catch (e) {
    if (e instanceof AcessoNegado) return { ok: false, error: e.motivo };
    throw e;
  }
  const agora = Date.now();
  const validos = itens.filter((i) => i.id && !Number.isNaN(new Date(i.quando).getTime()));
  if (validos.length === 0) return { ok: false, error: "nenhuma data válida" };
  if (validos.some((i) => new Date(i.quando).getTime() <= agora)) return { ok: false, error: "há uma data que já passou" };
  for (const i of validos) {
    await setPostSchedule(i.id, new Date(i.quando).toISOString());
    await setPostStatus(i.id, "scheduled");
  }
  revalidatePath("/posts");
  revalidatePath("/calendario");
  return { ok: true, agendados: validos.length };
}
