"use server";

import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getSettings, setSettings } from "@/server/settings";

// D11: pedido de ajuste fica salvo no post (historico curto, mais recente primeiro)
export async function pedirAjustePost(id: string, texto: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return { ok: false, error: "sessão expirada, faça login de novo" };
  const t = texto.trim();
  if (!t) return { ok: false, error: "escreva o ajuste antes de pedir" };
  const chave = `ajuste.${id}`;
  const s = await getSettings();
  let lista: { quando: string; texto: string }[] = [];
  try {
    lista = JSON.parse(s[chave] || "[]");
  } catch {
    lista = [];
  }
  lista = [{ quando: new Date().toISOString(), texto: t }, ...lista].slice(0, 10);
  await setSettings({ [chave]: JSON.stringify(lista) });
  revalidatePath("/aprovacao");
  return { ok: true };
}
