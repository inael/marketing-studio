// Cria tabelas da fase 2 (config global + horarios fixos por marca). Idempotente.
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
  await sql`create table if not exists app_settings (
    key text primary key,
    value text,
    updated_at timestamptz default now()
  )`;
  await sql`create table if not exists brand_timeslots (
    id uuid primary key default gen_random_uuid(),
    brand_id uuid references brands(id) on delete cascade,
    weekday int not null check (weekday between 0 and 6),
    hour int not null check (hour between 0 and 23),
    minute int not null default 0 check (minute between 0 and 59),
    created_at timestamptz default now(),
    unique (brand_id, weekday, hour, minute)
  )`;
  const tables = await sql`select table_name from information_schema.tables
    where table_schema='public' and table_name in ('app_settings','brand_timeslots') order by table_name`;
  console.log("ok:", tables.map((t) => t.table_name).join(", "));
} finally {
  await sql.end();
}
