import { sql } from "./db";
import { uploadPublic } from "./r2";

export type MediaAsset = {
  id: string;
  brand_id: string | null;
  tipo: string | null;
  url: string;
  origem: string | null;
  created_at: string;
};

export async function listMedia(brandId?: string): Promise<MediaAsset[]> {
  return brandId
    ? sql<MediaAsset[]>`select * from media_assets where brand_id = ${brandId} order by created_at desc limit 300`
    : sql<MediaAsset[]>`select * from media_assets order by created_at desc limit 300`;
}

export async function addMedia(i: {
  brand_id: string | null;
  url: string;
  tipo?: string;
  origem?: string;
}): Promise<void> {
  await sql`insert into media_assets (brand_id, url, tipo, origem)
    values (${i.brand_id}, ${i.url}, ${i.tipo ?? "image"}, ${i.origem ?? "upload"})`;
}

export async function deleteMedia(id: string): Promise<void> {
  await sql`delete from media_assets where id = ${id}`;
}

/** baixa uma URL remota (imagem/vídeo), sobe pro R2 e registra na biblioteca */
export async function saveRemoteMedia(
  remoteUrl: string,
  brandId: string | null,
  origem: string
): Promise<string> {
  const res = await fetch(remoteUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "application/octet-stream";
  const isVideo = ct.startsWith("video");
  const ext = isVideo ? "mp4" : ct.includes("png") ? "png" : "jpg";
  const key = `posts/${origem}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await uploadPublic(buf, key, ct);
  await addMedia({ brand_id: brandId, url, tipo: isVideo ? "video" : "image", origem });
  return url;
}
