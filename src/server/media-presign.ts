import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/server/r2";
import { sql } from "@/server/db";

// B05: URL assinada para um objeto especifico, valida por 5 minutos. O navegador envia direto ao R2.
export const TAMANHO_MAX = 12 * 1024 * 1024;
const MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function chaveDaMidia(brandSlug: string, nome: string): string {
  const ext = (nome.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `posts/${brandSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

export function mimeAceito(mime: string): boolean {
  return MIMES.includes(mime);
}

export async function urlAssinada(key: string, mime: string): Promise<string> {
  return getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: mime }), { expiresIn: 300 });
}

/** Confere no R2 que o objeto chegou com o tamanho e o tipo declarados */
export async function conferirObjeto(key: string, tamanho: number, mime: string): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const h = await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
  if (Number(h.ContentLength) !== tamanho) return { ok: false, motivo: "tamanho diferente do declarado" };
  if (h.ContentType && h.ContentType !== mime) return { ok: false, motivo: "tipo diferente do declarado" };
  return { ok: true };
}

export async function registrarEnvio(i: { brand_id: string; key: string; mime: string; size: number; url: string }) {
  const [m] = await sql<{ id: string }[]>`insert into media_assets (brand_id, url, tipo, origem, status, key, mime, size_bytes) values (${i.brand_id}, ${i.url}, ${i.mime.startsWith("video/") ? "video" : "image"}, ${"upload"}, ${"enviando"}, ${i.key}, ${i.mime}, ${i.size}) returning id`;
  return m.id;
}

export async function marcarPronta(id: string) {
  await sql`update media_assets set status = ${"pronta"} where id = ${id}`;
}

export async function marcarFalhou(id: string) {
  await sql`update media_assets set status = ${"falhou"} where id = ${id}`;
}
