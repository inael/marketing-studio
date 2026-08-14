// Adiciona brands.logo_url (logo enviada manualmente; tem prioridade sobre a
// foto do Instagram). Idempotente.
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
  await sql.unsafe(`ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url text`);
  console.log("ok: coluna logo_url pronta");
} finally {
  await sql.end();
}
