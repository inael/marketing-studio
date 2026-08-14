// Tabela efemera pra guardar o resultado do OAuth entre o callback e o seletor.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
function vault(key) {
  for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
    if (l.startsWith(key + "=")) return l.slice(key.length + 1).trim();
  }
  throw new Error(key + " nao encontrado");
}
const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  await sql`create table if not exists oauth_sessions (
    id uuid primary key default gen_random_uuid(),
    kind text not null,
    payload jsonb not null,
    created_at timestamptz default now()
  )`;
  const [{ ok }] = await sql`select to_regclass('public.oauth_sessions') is not null as ok`;
  console.log("oauth_sessions:", ok ? "OK" : "FALHOU");
} finally {
  await sql.end();
}
