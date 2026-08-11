import { sql } from "./db";

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
