import { sql } from "./db";

export type Persona = {
  id: string;
  nome: string;
  papel: "analista" | "gestor";
  tracos: string;
  instrucoes: string;
  ativo: boolean;
};

export async function listPersonas(): Promise<Persona[]> {
  return sql<Persona[]>`select * from personas order by papel, nome`;
}

export async function listAnalysts(): Promise<Persona[]> {
  return sql<Persona[]>`select * from personas where papel = 'analista' and ativo order by nome`;
}

export async function getManager(): Promise<Persona | null> {
  const [m] = await sql<Persona[]>`select * from personas where papel = 'gestor' and ativo order by nome limit 1`;
  return m ?? null;
}

export async function getPersona(id: string): Promise<Persona | null> {
  const [p] = await sql<Persona[]>`select * from personas where id = ${id}`;
  return p ?? null;
}

export type PersonaPatch = Partial<Pick<Persona, "nome" | "tracos" | "instrucoes" | "ativo">>;

export async function updatePersona(id: string, patch: PersonaPatch): Promise<void> {
  const keys = Object.keys(patch) as string[];
  if (keys.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sql`update personas set ${sql(patch as any, ...keys)} where id = ${id}`;
}

export async function createPersona(input: {
  nome: string;
  papel: "analista" | "gestor";
  tracos: string;
  instrucoes: string;
}): Promise<void> {
  await sql`insert into personas (nome, papel, tracos, instrucoes)
    values (${input.nome}, ${input.papel}, ${input.tracos}, ${input.instrucoes})
    on conflict (nome) do nothing`;
}
