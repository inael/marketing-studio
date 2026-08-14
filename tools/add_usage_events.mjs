// Registro de consumo de IA por funcionario (persona) e tipo. Idempotente.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function vault(key) {
  const f = path.join(os.homedir(), ".claude", "credentials", "services.env");
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    if (l.startsWith(key + "=")) return l.slice(key.length + 1).trim();
  }
  throw new Error(key + " nao no vault");
}

const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  await sql.unsafe(`
    create table if not exists usage_events (
      id uuid primary key default gen_random_uuid(),
      persona text,
      tipo text not null,
      model text,
      brand_id uuid,
      prompt_tokens int not null default 0,
      completion_tokens int not null default 0,
      total_tokens int not null default 0,
      credits numeric not null default 0,
      created_at timestamptz not null default now()
    )`);
  await sql.unsafe(`create index if not exists usage_events_created_idx on usage_events(created_at desc)`);
  console.log("ok: tabela usage_events pronta");
} finally {
  await sql.end();
}
