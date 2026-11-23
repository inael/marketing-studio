"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { exigirMarca, auditar } from "@/server/permissoes";
import {
  ANGULOS,
  MAX_ESTILO,
  MAX_PERSONAGENS,
  addEstilo,
  countEstilo,
  removeEstilo,
  addPersonagem,
  countPersonagens,
  removePersonagem,
  setPersonagemFoto,
  removePersonagemFoto,
  brandDoPersonagem,
  type Angulo,
} from "@/server/referencias";

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
}

const anguloValido = (a: string): a is Angulo => ANGULOS.some((x) => x.id === a);

export async function addEstiloAction(brandId: string, slug: string, url: string) {
  await requireAuth();
  await exigirMarca(brandId, "editar", "addEstilo");
  if (!url.startsWith("https://")) throw new Error("URL inválida");
  if ((await countEstilo(brandId)) >= MAX_ESTILO) throw new Error(`limite de ${MAX_ESTILO} imagens de estilo`);
  await addEstilo(brandId, url);
  await auditar("referencia estilo adicionada", brandId, brandId);
  revalidatePath(`/marcas/${slug}/referencias`);
}

export async function removeEstiloAction(brandId: string, slug: string, id: string) {
  await requireAuth();
  await exigirMarca(brandId, "editar", "removeEstilo");
  await removeEstilo(id, brandId);
  await auditar("referencia estilo removida", id, brandId);
  revalidatePath(`/marcas/${slug}/referencias`);
}

export async function addPersonagemAction(brandId: string, slug: string, nome: string) {
  await requireAuth();
  await exigirMarca(brandId, "editar", "addPersonagem");
  const n = nome.trim();
  if (!n) throw new Error("dê um nome ao personagem");
  if ((await countPersonagens(brandId)) >= MAX_PERSONAGENS) throw new Error(`limite de ${MAX_PERSONAGENS} personagens`);
  await addPersonagem(brandId, n.slice(0, 80));
  await auditar("personagem criado", brandId, brandId);
  revalidatePath(`/marcas/${slug}/referencias`);
}

/** formulario de criacao de personagem (recebe FormData do navegador) */
export async function criarPersonagemForm(brandId: string, slug: string, fd: FormData) {
  await addPersonagemAction(brandId, slug, String(fd.get("nome") ?? ""));
}

export async function removePersonagemAction(brandId: string, slug: string, personagemId: string) {
  await requireAuth();
  await exigirMarca(brandId, "editar", "removePersonagem");
  await removePersonagem(personagemId, brandId);
  await auditar("personagem removido", personagemId, brandId);
  revalidatePath(`/marcas/${slug}/referencias`);
}

export async function setPersonagemFotoAction(brandId: string, slug: string, personagemId: string, angulo: string, url: string) {
  await requireAuth();
  await exigirMarca(brandId, "editar", "setPersonagemFoto");
  if (!anguloValido(angulo)) throw new Error("ângulo inválido");
  if (!url.startsWith("https://")) throw new Error("URL inválida");
  if ((await brandDoPersonagem(personagemId)) !== brandId) throw new Error("personagem não pertence a esta marca");
  await setPersonagemFoto(personagemId, angulo, url);
  revalidatePath(`/marcas/${slug}/referencias`);
}

export async function removePersonagemFotoAction(brandId: string, slug: string, personagemId: string, angulo: string) {
  await requireAuth();
  await exigirMarca(brandId, "editar", "removePersonagemFoto");
  if (!anguloValido(angulo)) throw new Error("ângulo inválido");
  if ((await brandDoPersonagem(personagemId)) !== brandId) throw new Error("personagem não pertence a esta marca");
  await removePersonagemFoto(personagemId, angulo);
  revalidatePath(`/marcas/${slug}/referencias`);
}
