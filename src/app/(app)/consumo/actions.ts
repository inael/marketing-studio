"use server";

import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { setSettings } from "@/server/settings";

// M22: teto mensal de consumo de IA (US$), guardado nas configuracoes do workspace
export async function salvarTeto(formData: FormData) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) throw new Error("unauthenticated");
  const v = Number(formData.get("teto"));
  if (Number.isFinite(v) && v > 0) await setSettings({ "consumo.teto": String(v) });
  revalidatePath("/consumo");
}
