// Baixa uma imagem/vídeo (URL), sobe pro R2 e ANEXA ao post (posts.media).
// Também registra na biblioteca (media_assets). Uso:
//   node tools/attach_media.mjs <post_id> <url> [origem]
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

const [postId, url, origem = "higgsfield-mcp"] = process.argv.slice(2);
if (!postId || !url) { console.log("uso: node tools/attach_media.mjs <post_id> <url> [origem]"); process.exit(1); }

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = env.R2_LUANA_BUCKET;
const BASE = env.R2_LUANA_PUBLIC_BASE.replace(/\/$/, "");

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
try {
  const [post] = await sql`select id, brand_id, media from posts where id = ${postId} limit 1`;
  if (!post) { console.log("post nao encontrado:", postId); process.exit(1); }

  const res = await fetch(url);
  if (!res.ok) { console.log("download falhou:", res.status); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/png";
  const isVideo = ct.startsWith("video");
  const ext = isVideo ? "mp4" : ct.includes("png") ? "png" : "jpg";
  const key = `posts/auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: ct }));
  const publicUrl = `${BASE}/${key}`;

  const current = Array.isArray(post.media) ? post.media : [];
  const media = [...current, publicUrl];
  await sql`update posts set media = ${media}, updated_at = now() where id = ${postId}`;
  await sql`insert into media_assets (brand_id, url, tipo, origem)
    values (${post.brand_id}, ${publicUrl}, ${isVideo ? "video" : "image"}, ${origem})`;

  // registra o consumo de imagem (FLUX.2 Pro 1K ~ 1 credito) no relatorio de consumo
  if (!isVideo) {
    try {
      await sql`insert into usage_events (persona, tipo, model, brand_id, credits)
        values (null, 'imagem', ${origem}, ${post.brand_id}, 1)`;
    } catch {}
  }

  console.log("OK anexado ->", publicUrl, "| post:", postId, "| media agora:", media.length);
} finally {
  await sql.end();
}
