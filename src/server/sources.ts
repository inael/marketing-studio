import { sql } from "./db";

export type SourceKind = "rss" | "competitor";
export type ContentSource = {
  id: string;
  brand_id: string;
  kind: SourceKind;
  value: string;
  ativo: boolean;
};

export async function listSources(brandId: string): Promise<ContentSource[]> {
  return sql<ContentSource[]>`
    select * from content_sources where brand_id = ${brandId}
    order by kind, created_at`;
}

export async function addSource(brandId: string, kind: SourceKind, value: string): Promise<void> {
  const v = value.trim();
  if (!v) return;
  await sql`insert into content_sources (brand_id, kind, value)
    values (${brandId}, ${kind}, ${v})
    on conflict (brand_id, kind, value) do nothing`;
}

export async function removeSource(id: string): Promise<void> {
  await sql`delete from content_sources where id = ${id}`;
}
