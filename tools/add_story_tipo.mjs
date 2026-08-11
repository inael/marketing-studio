// Libera o tipo 'story' no check de posts.tipo (aditivo). Idempotente.
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
  await sql.unsafe(`DO $$
  DECLARE cname text;
  BEGIN
    SELECT conname INTO cname FROM pg_constraint
      WHERE conrelid = 'posts'::regclass AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%tipo%';
    IF cname IS NOT NULL THEN EXECUTE format('ALTER TABLE posts DROP CONSTRAINT %I', cname); END IF;
  END $$;`);
  await sql.unsafe(
    `ALTER TABLE posts ADD CONSTRAINT posts_tipo_check CHECK (tipo IN ('carousel','image','reel','story'))`
  );
  const [{ def }] = await sql`select pg_get_constraintdef(oid) as def from pg_constraint where conname='posts_tipo_check'`;
  console.log("ok:", def);
} finally {
  await sql.end();
}
