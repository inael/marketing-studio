// Cria content_sources (RSS + concorrentes por marca). Idempotente.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function vault(key) {
  const f = path.join(os.homedir(), ".claude", "credentials", "services.env");
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    if (l.startsWith(key + "=")) return l.slice(key.length + 1).trim();
  }
  throw new Error(key + " nao encontrado no vault");
}

const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  await sql`create table if not exists content_sources (
    id uuid primary key default gen_random_uuid(),
    brand_id uuid references brands(id) on delete cascade,
    kind text not null check (kind in ('rss','competitor')),
    value text not null,
    ativo boolean default true,
    created_at timestamptz default now(),
    unique (brand_id, kind, value)
  )`;
  const [{ ok }] = await sql`select to_regclass('public.content_sources') is not null as ok`;
  console.log("content_sources:", ok ? "OK" : "FALHOU");
} finally {
  await sql.end();
}
