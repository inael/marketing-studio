import { sql } from "./db";

export type PostStatus = "draft" | "approved" | "scheduled" | "published" | "failed";

export type Post = {
  id: string;
  brand_id: string;
  tipo: "carousel" | "image" | "reel" | "story";
  formato: string;
  legenda: string;
  hashtags: string[];
  media: string[];
  scheduled_at: string | null;
  status: PostStatus;
  external_url: string | null;
  origem: "manual" | "auto";
};

export async function getPost(id: string): Promise<Post | null> {
  const [p] = await sql<Post[]>`select * from posts where id=${id}`;
  return p ?? null;
}

export async function listPosts(brandId?: string): Promise<Post[]> {
  return brandId
    ? sql<Post[]>`select * from posts where brand_id=${brandId} order by created_at desc`
    : sql<Post[]>`select * from posts order by created_at desc`;
}

export async function createPost(i: {
  brand_id: string;
  tipo: Post["tipo"];
  formato: string;
  legenda: string;
  hashtags: string[];
  media: string[];
  scheduled_at?: string | null;
  status?: PostStatus;
  origem?: Post["origem"];
}): Promise<Post> {
  const row = {
    brand_id: i.brand_id,
    tipo: i.tipo,
    formato: i.formato,
    legenda: i.legenda,
    hashtags: i.hashtags,
    media: i.media,
    scheduled_at: i.scheduled_at ?? null,
    status: i.status ?? "draft",
    origem: i.origem ?? "manual",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [p] = await sql<Post[]>`insert into posts ${sql(row as any)} returning *`;
  return p;
}

export async function deletePost(id: string): Promise<void> {
  await sql`delete from publish_logs where post_id = ${id}`;
  await sql`delete from posts where id = ${id}`;
}

/** rascunhos criados pela automação (origem=auto) ainda parados hoje, por marca */
export async function listTodayAutoDrafts(brandId: string): Promise<Post[]> {
  return sql<Post[]>`
    select * from posts
    where brand_id = ${brandId}
      and origem = 'auto'
      and status = 'draft'
      and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
    order by created_at asc`;
}

/** posts agendados cujo horário já venceu (pro cron publicar) */
export async function listDueScheduled(nowISO: string): Promise<Post[]> {
  return sql<Post[]>`
    select * from posts
    where status = 'scheduled' and scheduled_at is not null and scheduled_at <= ${nowISO}
    order by scheduled_at asc
    limit 25`;
}

export async function setPostStatus(
  id: string,
  status: PostStatus,
  patch: Partial<Post> & { erro?: string } = {}
): Promise<void> {
  await sql`update posts set status=${status}, external_url=${patch.external_url ?? null}, erro=${
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (patch as any).erro ?? null
  }, updated_at=now() where id=${id}`;
}
