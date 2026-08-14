import { sql } from "./db";
import type { Idea } from "./planner";

export type Grupo = "noticia" | "concorrente";

export type Suggestion = {
  id: string;
  brand_id: string;
  grupo: Grupo;
  titulo: string | null;
  angulo: string | null;
  legenda: string;
  formato: string | null;
  analista: string | null;
  ref_url: string | null;
  ref_label: string | null;
  imagem_prompt: string | null;
  status: string;
  created_at: string;
};

/** sugestões ainda ativas (não aceitas) de uma marca, ou de todas. */
export async function listSuggestions(brandId?: string): Promise<Suggestion[]> {
  return brandId
    ? sql<Suggestion[]>`select * from suggestions where brand_id=${brandId} and status='nova' order by created_at desc`
    : sql<Suggestion[]>`select * from suggestions where status='nova' order by created_at desc`;
}

export async function getSuggestion(id: string): Promise<Suggestion | null> {
  const [s] = await sql<Suggestion[]>`select * from suggestions where id=${id}`;
  return s ?? null;
}

/** grava um lote de ideias como sugestões e devolve as linhas criadas. */
export async function addSuggestions(
  brandId: string,
  grupo: Grupo,
  ideas: Idea[]
): Promise<Suggestion[]> {
  const rows = ideas
    .filter((i) => i.legenda)
    .map((i) => ({
      brand_id: brandId,
      grupo,
      titulo: i.titulo ?? null,
      angulo: i.angulo ?? null,
      legenda: i.legenda!,
      formato: i.formato ?? "image",
      analista: i.analista ?? null,
      ref_url: i.ref_url ?? null,
      ref_label: i.ref_label ?? null,
      imagem_prompt: i.imagem_prompt ?? null,
    }));
  if (!rows.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sql<Suggestion[]>`insert into suggestions ${sql(rows as any)} returning *`;
}

export async function deleteSuggestion(id: string): Promise<void> {
  await sql`delete from suggestions where id=${id}`;
}

export async function deleteSuggestions(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await sql`delete from suggestions where id in ${sql(ids)}`;
}

/** limpa as sugestões de uma marca (ou todas). */
export async function clearSuggestions(brandId?: string): Promise<void> {
  if (brandId) await sql`delete from suggestions where brand_id=${brandId}`;
  else await sql`delete from suggestions`;
}

export async function markAccepted(id: string): Promise<void> {
  await sql`update suggestions set status='aceita' where id=${id}`;
}
