// Cria a tabela suggestions (sugestões persistidas) e enriquece posts com
// analista/fonte/imagem_prompt/deleted_at. Idempotente.
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
    create table if not exists suggestions (
      id uuid primary key default gen_random_uuid(),
      brand_id uuid not null,
      grupo text not null,
      titulo text,
      angulo text,
      legenda text not null,
      formato text,
      analista text,
      ref_url text,
      ref_label text,
      imagem_prompt text,
      status text not null default 'nova',
      created_at timestamptz not null default now()
    );
  `);
  await sql.unsafe(`create index if not exists suggestions_brand_idx on suggestions(brand_id, created_at desc)`);

  for (const col of [
    "analista text",
    "fonte_tipo text",
    "fonte_url text",
    "fonte_label text",
    "imagem_prompt text",
    "deleted_at timestamptz",
  ]) {
    await sql.unsafe(`alter table posts add column if not exists ${col}`);
  }
  console.log("ok: tabela suggestions + colunas de posts prontas");
} finally {
  await sql.end();
}
