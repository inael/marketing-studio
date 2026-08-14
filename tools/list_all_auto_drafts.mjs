// Lista TODOS os rascunhos automáticos (origem=auto, sem mídia) de imagem/carrossel
// de todas as marcas, em JSON. (Reels ficam de fora — precisam de vídeo.)
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
    select p.id, b.slug, b.nome, p.tipo, p.legenda
    from posts p join brands b on b.id = p.brand_id
    where p.origem = 'auto' and p.status = 'draft'
      and p.tipo in ('image','carousel')
      and coalesce(array_length(p.media, 1), 0) = 0
    order by b.slug, p.created_at asc`;
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await sql.end();
}
