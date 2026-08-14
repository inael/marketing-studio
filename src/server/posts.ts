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
  analista: string | null;
  fonte_tipo: string | null;
  fonte_url: string | null;
  fonte_label: string | null;
  imagem_prompt: string | null;
  deleted_at: string | null;
};

export async function getPost(id: string): Promise<Post | null> {
  const [p] = await sql<Post[]>`select * from posts where id=${id}`;
  return p ?? null;
}

export async function listPosts(brandId?: string): Promise<Post[]> {
  return brandId
    ? sql<Post[]>`select * from posts where brand_id=${brandId} and deleted_at is null order by created_at desc`
    : sql<Post[]>`select * from posts where deleted_at is null order by created_at desc`;
}

/** exclusão reversível (mantém a linha pra contabilizar "excluídos"). */
export async function softDeletePost(id: string): Promise<void> {
  await sql`update posts set deleted_at = now(), updated_at = now() where id = ${id}`;
}

export type Analytics = {
  deleted: number;
  ranking: { analista: string; total: number; publicados: number }[];
};

/** ranking de posts por funcionário (analista) + quantos posts foram excluídos. */
export async function postsAnalytics(): Promise<Analytics> {
  const [{ deleted }] = await sql<{ deleted: number }[]>`
    select count(*)::int as deleted from posts where deleted_at is not null`;
  const ranking = await sql<{ analista: string; total: number; publicados: number }[]>`
    select
      coalesce(analista, 'sem autor') as analista,
      count(*)::int as total,
      count(*) filter (where status = 'published')::int as publicados
    from posts
    where deleted_at is null and analista is not null
    group by 1
    order by total desc`;
  return { deleted, ranking };
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
  analista?: string | null;
  fonte_tipo?: string | null;
  fonte_url?: string | null;
  fonte_label?: string | null;
  imagem_prompt?: string | null;
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
    analista: i.analista ?? null,
    fonte_tipo: i.fonte_tipo ?? null,
    fonte_url: i.fonte_url ?? null,
    fonte_label: i.fonte_label ?? null,
    imagem_prompt: i.imagem_prompt ?? null,
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
      and deleted_at is null
      and created_at >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
    order by created_at asc`;
}

/** posts agendados cujo horário já venceu (pro cron publicar) */
export async function listDueScheduled(nowISO: string): Promise<Post[]> {
  return sql<Post[]>`
    select * from posts
    where status = 'scheduled' and scheduled_at is not null and scheduled_at <= ${nowISO}
      and deleted_at is null
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
