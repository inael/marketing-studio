"use server";

import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { setPostSchedule } from "@/server/posts";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
}

// D18: soltar um bloco na grade semanal muda o horário do post
export async function reagendarPost(id: string, iso: string): Promise<ActionResult> {
  await requireAuth();
  const quando = new Date(iso);
  if (Number.isNaN(quando.getTime())) return { ok: false, error: "horário inválido" };
  await setPostSchedule(id, quando.toISOString());
  revalidatePath("/calendario");
  revalidatePath("/posts");
  revalidatePath("/aprovacao");
  return { ok: true };
}
