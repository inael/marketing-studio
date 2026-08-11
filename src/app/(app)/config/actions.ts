"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { setSettings } from "@/server/settings";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveConfig(formData: FormData) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");

  const patch: Record<string, string | undefined> = {
    ai_provider: str(formData, "ai_provider") || "usetokia",
    usetokia_base_url: str(formData, "usetokia_base_url"),
    usetokia_model: str(formData, "usetokia_model"),
    litellm_base_url: str(formData, "litellm_base_url"),
    litellm_model: str(formData, "litellm_model"),
  };

  // secrets: só grava se um novo valor for digitado (nunca sobrescreve com vazio)
  const uk = str(formData, "usetokia_api_key");
  if (uk) patch.usetokia_api_key = uk;
  const lk = str(formData, "litellm_api_key");
  if (lk) patch.litellm_api_key = lk;
  const hk = str(formData, "higgsfield_api_key");
  if (hk) patch.higgsfield_api_key = hk;
  const ek = str(formData, "elevenlabs_api_key");
  if (ek) patch.elevenlabs_api_key = ek;
  const ev = str(formData, "elevenlabs_voice_id");
  patch.elevenlabs_voice_id = ev;

  await setSettings(patch);
  revalidatePath("/config");
  redirect("/config?ok=1");
}
