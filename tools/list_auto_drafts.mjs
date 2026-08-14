// Lista os rascunhos automáticos (origem=auto, sem mídia) de uma marca em JSON.
// Uso: node tools/list_auto_drafts.mjs <brand_slug>
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
const slug = process.argv[2];
if (!slug) { console.log("uso: node tools/list_auto_drafts.mjs <slug>"); process.exit(1); }

const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  const rows = await sql`
    select p.id, p.tipo, p.legenda
    from posts p join brands b on b.id = p.brand_id
    where b.slug = ${slug} and p.origem = 'auto' and p.status = 'draft'
      and coalesce(array_length(p.media, 1), 0) = 0
    order by p.created_at asc`;
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await sql.end();
}
