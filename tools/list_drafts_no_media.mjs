// Lista rascunhos de imagem/carrossel SEM mídia (com legenda e prompt sugerido),
// pra gerar as imagens via MCP. JSON.
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
  const rows = await sql`
    select p.id, b.slug, p.tipo, left(p.legenda, 80) as legenda, p.imagem_prompt
    from posts p join brands b on b.id = p.brand_id
    where p.status = 'draft' and p.deleted_at is null
      and p.tipo in ('image','carousel')
      and coalesce(array_length(p.media, 1), 0) = 0
    order by b.slug, p.created_at asc`;
  console.log(JSON.stringify(rows, null, 2));
  console.log("TOTAL:", rows.length);
} finally {
  await sql.end();
}
