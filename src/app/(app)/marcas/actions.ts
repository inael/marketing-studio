"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { updateBrand, type BrandPatch } from "@/server/brands";

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveBrand(id: string, formData: FormData) {
  await requireAuth();

  const patch: BrandPatch = {
    nome: str(formData, "nome"),
    cor_principal: str(formData, "cor_principal"),
    site_url: str(formData, "site_url"),
    fonte: str(formData, "fonte"),
    tom_voz: str(formData, "tom_voz"),
    ig_user_id: str(formData, "ig_user_id") || null,
    ativo: formData.get("ativo") === "on",
  };

  // token só é alterado se um novo for digitado (não sobrescreve com vazio)
  const igTok = str(formData, "ig_token");
  if (igTok) patch.ig_token = igTok;

  await updateBrand(id, patch);
  revalidatePath("/marcas");
  redirect("/marcas");
}
