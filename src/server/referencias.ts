import { sql } from "./db";

export const ANGULOS = [
  { id: "rosto_frente", rotulo: "Rosto de frente", grupo: "rosto" },
  { id: "rosto_perfil_esq", rotulo: "Rosto perfil esquerdo", grupo: "rosto" },
  { id: "rosto_perfil_dir", rotulo: "Rosto perfil direito", grupo: "rosto" },
  { id: "rosto_diagonal", rotulo: "Rosto 3/4", grupo: "rosto" },
  { id: "corpo_frente", rotulo: "Corpo de frente", grupo: "corpo" },
  { id: "corpo_lateral_esq", rotulo: "Corpo lateral esquerda", grupo: "corpo" },
  { id: "corpo_lateral_dir", rotulo: "Corpo lateral direita", grupo: "corpo" },
  { id: "corpo_costas", rotulo: "Corpo de costas", grupo: "corpo" },
] as const;

export type Angulo = (typeof ANGULOS)[number]["id"];

export const MAX_ESTILO = 10;
export const MIN_ESTILO_RECOMENDADO = 5;
export const MAX_PERSONAGENS = 10;

export type EstiloRef = { id: string; url: string; ordem: number };
export type Personagem = { id: string; nome: string; fotos: Partial<Record<Angulo, string>> };

export async function listEstilo(brandId: string): Promise<EstiloRef[]> {
  return sql<EstiloRef[]>`select id, url, ordem from referencias_estilo where brand_id = ${brandId} order by ordem, created_at`;
}

export async function countEstilo(brandId: string): Promise<number> {
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from referencias_estilo where brand_id = ${brandId}`;
  return r?.n ?? 0;
}

export async function addEstilo(brandId: string, url: string): Promise<void> {
  const [r] = await sql<{ n: number }[]>`select coalesce(max(ordem), 0)::int + 1 as n from referencias_estilo where brand_id = ${brandId}`;
  await sql`insert into referencias_estilo (brand_id, url, ordem) values (${brandId}, ${url}, ${r?.n ?? 1})`;
}

export async function removeEstilo(id: string, brandId: string): Promise<void> {
  await sql`delete from referencias_estilo where id = ${id} and brand_id = ${brandId}`;
}

export async function listPersonagens(brandId: string): Promise<Personagem[]> {
  const rows = await sql<{ id: string; nome: string }[]>`select id, nome from personagens where brand_id = ${brandId} order by created_at`;
  if (rows.length === 0) return [];
  const fotos = await sql<{ personagem_id: string; angulo: Angulo; url: string }[]>`
    select personagem_id, angulo, url from personagem_fotos where personagem_id in ${sql(rows.map((r) => r.id))}`;
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    fotos: Object.fromEntries(fotos.filter((f) => f.personagem_id === r.id).map((f) => [f.angulo, f.url])),
  }));
}

export async function countPersonagens(brandId: string): Promise<number> {
  const [r] = await sql<{ n: number }[]>`select count(*)::int as n from personagens where brand_id = ${brandId}`;
  return r?.n ?? 0;
}

export async function addPersonagem(brandId: string, nome: string): Promise<void> {
  await sql`insert into personagens (brand_id, nome) values (${brandId}, ${nome})`;
}

export async function removePersonagem(id: string, brandId: string): Promise<void> {
  await sql`delete from personagens where id = ${id} and brand_id = ${brandId}`;
}

export async function setPersonagemFoto(personagemId: string, angulo: Angulo, url: string): Promise<void> {
  await sql`insert into personagem_fotos (personagem_id, angulo, url) values (${personagemId}, ${angulo}, ${url})
    on conflict (personagem_id, angulo) do update set url = excluded.url, updated_at = now()`;
}

export async function removePersonagemFoto(personagemId: string, angulo: Angulo): Promise<void> {
  await sql`delete from personagem_fotos where personagem_id = ${personagemId} and angulo = ${angulo}`;
}

/** marca do personagem, para checar permissao antes de alterar */
export async function brandDoPersonagem(personagemId: string): Promise<string | null> {
  const [r] = await sql<{ brand_id: string }[]>`select brand_id from personagens where id = ${personagemId}`;
  return r?.brand_id ?? null;
}
