"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { updatePersona } from "@/server/personas";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function savePersona(id: string, formData: FormData) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
  await updatePersona(id, {
    nome: str(formData, "nome"),
    tracos: str(formData, "tracos"),
    instrucoes: str(formData, "instrucoes"),
    ativo: formData.get("ativo") === "on",
  });
  revalidatePath("/time");
  redirect("/time");
}
