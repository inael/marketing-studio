// Adiciona a coluna posts.origem ('manual'|'auto') pra distinguir posts
// criados pela automação. Idempotente.
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
  await sql.unsafe(
    `ALTER TABLE posts ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual'`
  );
  const [{ n }] = await sql`select count(*)::int as n from posts where origem='auto'`;
  console.log("ok: coluna origem pronta; posts auto atuais =", n);
} finally {
  await sql.end();
}
