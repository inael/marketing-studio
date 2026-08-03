import { getPost, setPostStatus } from "./posts";
import { publishImages } from "./graph";
import { formatCaption } from "@/lib/caption";
import { sql } from "./db";

async function getBrandById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [b] = await sql<any[]>`select * from brands where id=${id}`;
  return b ?? null;
}
async function logPublish(postId: string, rede: string, status: string, externalId: string | null, erro: string | null) {
  await sql`insert into publish_logs (post_id, rede, status, external_id, erro) values (${postId}, ${rede}, ${status}, ${externalId}, ${erro})`;
}

type Deps = {
  getPost: typeof getPost;
  getBrandById: typeof getBrandById;
  publishImages: typeof publishImages;
  setPostStatus: typeof setPostStatus;
  logPublish: typeof logPublish;
  env: Record<string, string | undefined>;
};
const realDeps: Deps = { getPost, getBrandById, publishImages, setPostStatus, logPublish, env: process.env };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveAccount(brand: any, env: Record<string, string | undefined>) {
  if (brand.ig_user_id && brand.ig_token) return { igUserId: brand.ig_user_id, token: brand.ig_token };
  const p = brand.slug.toUpperCase();
  const id = env[`META_${p}_IG_USER_ID`];
  const tok = env[`META_${p}_ACCESS_TOKEN`];
  if (id && tok) return { igUserId: id, token: tok };
  throw new Error(`sem credenciais IG pra brand ${brand.slug}`);
}

export async function publishPost(
  postId: string,
  deps: Deps = realDeps
): Promise<{ ok: true; url: string | null } | { ok: false; error: string }> {
  const post = await deps.getPost(postId);
  if (!post) return { ok: false, error: "post_not_found" };
  if (post.status !== "approved") return { ok: false, error: "not_approved" };
  const brand = await deps.getBrandById(post.brand_id);
  if (!brand) return { ok: false, error: "brand_not_found" };
  try {
    const acc = resolveAccount(brand, deps.env);
    const caption = formatCaption(post.legenda, post.hashtags);
    const { mediaId, permalink } = await deps.publishImages(acc, post.media, caption);
    await deps.logPublish(postId, "ig", "published", mediaId, null);
    await deps.setPostStatus(postId, "published", { external_url: permalink });
    return { ok: true, url: permalink };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const error = e?.message ?? String(e);
    await deps.logPublish(postId, "ig", "failed", null, error);
    await deps.setPostStatus(postId, "failed", { erro: error });
    return { ok: false, error };
  }
}
