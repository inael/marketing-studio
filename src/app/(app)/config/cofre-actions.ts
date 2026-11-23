"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getSettings, setSettings } from "@/server/settings";
import { COFRE_ITENS, chaveCofre, lerRegistro, type RegistroCofre } from "@/server/cofre";
import { usuarioAtual } from "@/server/permissoes";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
}

async function registrar(acao: RegistroCofre["acao"], marca: string, item: string) {
  const atual = lerRegistro(await getSettings());
  const autor = await usuarioAtual();
  const novo: RegistroCofre[] = [{ quando: new Date().toISOString(), acao, marca, item, autor }, ...atual].slice(0, 30);
  await setSettings({ "cofre.log": JSON.stringify(novo) });
}

// D40: grava so se o valor for digitado; nunca mostra de volta
export async function salvarSegredo(formData: FormData) {
  await requireAuth();
  const slug = str(formData, "slug");
  const item = str(formData, "item");
  const valor = str(formData, "valor");
  if (!slug || !(COFRE_ITENS as readonly string[]).includes(item)) return;
  // D40: validacao antes de salvar: tamanho minimo e sem espacos nas pontas
  if (valor.length < 8 || valor !== valor.trim()) return;
  const k = chaveCofre(slug, item);
  await setSettings({ [k]: valor, [`${k}.ult4`]: valor.slice(-4), [`${k}.criado`]: new Date().toISOString() });
  await registrar("salvou", slug, item);
  revalidatePath("/config");
}

export async function removerSegredo(formData: FormData) {
  await requireAuth();
  const slug = str(formData, "slug");
  const item = str(formData, "item");
  if (!slug || !(COFRE_ITENS as readonly string[]).includes(item)) return;
  const k = chaveCofre(slug, item);
  await setSettings({ [k]: null, [`${k}.ult4`]: null, [`${k}.criado`]: null });
  await registrar("removeu", slug, item);
  revalidatePath("/config");
}
