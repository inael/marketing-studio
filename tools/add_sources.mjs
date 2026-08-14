// Adiciona fontes (rss|competitor) a uma marca. Idempotente.
// Uso: node tools/add_sources.mjs <slug> <rss|competitor> <valor1> [valor2 ...]
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
const [slug, kind, ...values] = process.argv.slice(2);
if (!slug || !kind || !values.length) {
  console.log("uso: node tools/add_sources.mjs <slug> <rss|competitor> <v1> [v2 ...]");
  process.exit(1);
}
const clean = (v) => (kind === "competitor" ? v.replace(/^@+/, "").replace(/\s+/g, "") : v.trim());

const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  const [brand] = await sql`select id, nome from brands where slug = ${slug} limit 1`;
  if (!brand) { console.log("marca nao encontrada:", slug); process.exit(1); }
  for (const raw of values) {
    const v = clean(raw);
    if (!v) continue;
    await sql`insert into content_sources (brand_id, kind, value)
      values (${brand.id}, ${kind}, ${v}) on conflict (brand_id, kind, value) do nothing`;
    console.log("+", kind, v);
  }
  console.log("ok:", brand.nome);
} finally {
  await sql.end();
}
