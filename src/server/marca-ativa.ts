"use server";

import { cookies } from "next/headers";

// D05: marca ativa do usuario, guardada em cookie e valida em todas as telas.
const NOME = "ms_marca";

export async function setMarcaAtiva(slug: string | null): Promise<void> {
  const jar = await cookies();
  if (!slug || slug === "todas") {
    jar.delete(NOME);
    return;
  }
  jar.set(NOME, slug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}

export async function getMarcaAtivaSlug(): Promise<string | null> {
  return (await cookies()).get(NOME)?.value ?? null;
}
