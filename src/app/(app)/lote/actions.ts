"use server";

import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { setPostSchedule, setPostStatus } from "@/server/posts";

// D19: agenda o lote que o revisor aprovou na tela de lote.
export async function agendarLote(formData: FormData): Promise<void> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
  // D19: so grava itens com id e data validos; um item ruim nao derruba o lote
  let bruto: unknown = [];
  try {
    bruto = JSON.parse(String(formData.get("plano") ?? "[]"));
  } catch {
    bruto = [];
  }
  const plano = (Array.isArray(bruto) ? bruto : []).filter(
    (it): it is { id: string; quando: string } =>
      typeof it?.id === "string" && !Number.isNaN(new Date(it?.quando).getTime()),
  );
  for (const it of plano) {
    await setPostSchedule(it.id, new Date(it.quando).toISOString());
    await setPostStatus(it.id, "scheduled");
  }
  revalidatePath("/lote");
  revalidatePath("/posts");
  revalidatePath("/calendario");
}
