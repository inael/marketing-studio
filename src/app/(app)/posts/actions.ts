"use server";

import { setPostStatus } from "@/server/posts";
import { publishPost } from "@/server/publish";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { revalidatePath } from "next/cache";

export async function approvePost(id: string): Promise<void> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
  // aprovado_por = claims?.sub (adicionar coluna no schema se quiser rastrear quem aprovou)
  await setPostStatus(id, "approved", {});
  revalidatePath("/posts");
}

export async function publishPostAction(id: string): Promise<void> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
  await publishPost(id);
  revalidatePath("/posts");
}
