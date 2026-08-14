import { sql } from "./db";

// Guarda o resultado do OAuth (tokens + contas) entre o callback e o seletor.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createOauthSession(kind: string, payload: any): Promise<string> {
  const [r] = await sql<{ id: string }[]>`
    insert into oauth_sessions (kind, payload) values (${kind}, ${sql.json(payload)}) returning id`;
  return r.id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOauthSession(id: string): Promise<any | null> {
  const [r] = await sql<{ payload: unknown }[]>`
    select payload from oauth_sessions
    where id = ${id} and created_at > now() - interval '15 minutes'`;
  return r?.payload ?? null;
}

export async function deleteOauthSession(id: string): Promise<void> {
  await sql`delete from oauth_sessions where id = ${id}`;
}
