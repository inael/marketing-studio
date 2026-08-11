// Pega uma midia gerada (URL), sobe pro R2 e insere na biblioteca (media_assets) da marca.
// Uso: node tools/mcp_to_library.mjs <url> <brand_slug> [origem]
import postgres from "postgres";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const env = {};
for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i > 0 && !l.startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}

const [url, slug, origem = "higgsfield-mcp"] = process.argv.slice(2);
if (!url || !slug) { console.log("uso: node mcp_to_library.mjs <url> <brand_slug> [origem]"); process.exit(1); }

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = env.R2_LUANA_BUCKET;
const BASE = env.R2_LUANA_PUBLIC_BASE.replace(/\/$/, "");

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
try {
  const [brand] = await sql`select id, nome from brands where slug = ${slug} limit 1`;
  if (!brand) { console.log("marca nao encontrada:", slug); process.exit(1); }

  const res = await fetch(url);
  if (!res.ok) { console.log("download falhou:", res.status); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/png";
  const isVideo = ct.startsWith("video");
  const ext = isVideo ? "mp4" : ct.includes("png") ? "png" : "jpg";
  const key = `posts/mcp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: ct }));
  const publicUrl = `${BASE}/${key}`;

  await sql`insert into media_assets (brand_id, url, tipo, origem)
    values (${brand.id}, ${publicUrl}, ${isVideo ? "video" : "image"}, ${origem})`;

  console.log("OK ->", publicUrl, "| marca:", brand.nome, "|", buf.length, "bytes");
} finally {
  await sql.end();
}
