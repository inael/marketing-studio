// Cache dos relatórios de concorrentes (evita bater a Graph API a cada abertura).
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
    create table if not exists report_cache (
      brand_id uuid not null,
      days int not null default 30,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      primary key (brand_id, days)
    )`);
  console.log("ok: tabela report_cache pronta");
} finally {
  await sql.end();
}
