import { sql } from "./db";
import { getBrandById } from "./brands";
import { listSources } from "./sources";
import { resolveIg } from "./planner";

const GRAPH = "https://graph.facebook.com/v21.0";

export type PostLite = {
  likes: number;
  comments: number;
  caption: string;
  permalink: string | null;
  tipo: string;
  thumb: string | null;
  timestamp: string | null;
};
export type AccountStats = {
  username: string;
  self: boolean;
  followers: number;
  mediaTotal: number;
  posts: number;
  likes: number;
  comments: number;
  avgInter: number;
  postsPerWeek: number;
  engajamento: number; // %
  byWeekday: number[]; // 7
  byHour: number[]; // 8 faixas de 3h
  hashtags: { tag: string; n: number }[];
  best: PostLite[];
  worst: PostLite[];
  error?: string;
};
export type Report = {
  self: AccountStats | null;
  competitors: AccountStats[];
  days: number;
  generatedAt: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseMedia(media: any[], days: number): Omit<AccountStats, "username" | "self" | "followers" | "mediaTotal"> {
  const cutoff = Date.now() - days * 86400_000;
  const all: PostLite[] = (media ?? []).map((m) => ({
    likes: m.like_count ?? 0,
    comments: m.comments_count ?? 0,
    caption: m.caption ?? "",
    permalink: m.permalink ?? null,
    tipo: (m.media_product_type || m.media_type || "").toString().toLowerCase(),
    thumb: m.thumbnail_url ?? m.media_url ?? null,
    timestamp: m.timestamp ?? null,
  }));
  const inWindow = all.filter((p) => !p.timestamp || new Date(p.timestamp).getTime() >= cutoff);
  const list = inWindow.length ? inWindow : all;

  const posts = list.length;
  const likes = list.reduce((s, p) => s + p.likes, 0);
  const comments = list.reduce((s, p) => s + p.comments, 0);
  const avgInter = posts ? (likes + comments) / posts : 0;
  const postsPerWeek = days ? posts / (days / 7) : posts;

  const byWeekday = Array(7).fill(0);
  const byHour = Array(8).fill(0);
  for (const p of list) {
    if (!p.timestamp) continue;
    const d = new Date(new Date(p.timestamp).getTime() - 3 * 3600_000); // BRT
    byWeekday[d.getUTCDay()]++;
    byHour[Math.floor(d.getUTCHours() / 3)]++;
  }

  const tags = new Map<string, number>();
  for (const p of list) {
    for (const m of p.caption.matchAll(/#([\p{L}\p{N}_]+)/gu)) {
      const t = m[1].toLowerCase();
      tags.set(t, (tags.get(t) ?? 0) + 1);
    }
  }
  const hashtags = [...tags.entries()].map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n).slice(0, 8);

  const sorted = [...list].sort((a, b) => b.likes + b.comments - (a.likes + a.comments));
  const best = sorted.slice(0, 3);
  const worst = sorted.length > 3 ? sorted.slice(-3).reverse() : [];

  return { posts, likes, comments, avgInter, postsPerWeek, engajamento: 0, byWeekday, byHour, hashtags, best, worst };
}

async function fetchStats(
  acc: { igUserId: string; token: string },
  username: string | null,
  days: number
): Promise<AccountStats> {
  const mediaFields = "like_count,comments_count,caption,permalink,media_type,media_product_type,timestamp,thumbnail_url,media_url";
  const url = username
    ? `${GRAPH}/${acc.igUserId}?fields=business_discovery.username(${encodeURIComponent(
        username
      )}){username,followers_count,media_count,media.limit(50){${mediaFields}}}&access_token=${encodeURIComponent(acc.token)}`
    : `${GRAPH}/${acc.igUserId}?fields=username,followers_count,media_count,media.limit(50){${mediaFields}}&access_token=${encodeURIComponent(
        acc.token
      )}`;
  try {
    const data = await (await fetch(url)).json();
    if (data?.error) throw new Error(data.error.message ?? "graph error");
    const node = username ? data.business_discovery : data;
    if (!node) throw new Error("sem dados (perfil privado ou inexistente)");
    const stats = parseMedia(node.media?.data ?? [], days);
    const followers = node.followers_count ?? 0;
    return {
      username: node.username ?? username ?? "",
      self: !username,
      followers,
      mediaTotal: node.media_count ?? 0,
      ...stats,
      engajamento: followers ? (stats.avgInter / followers) * 100 : 0,
    };
  } catch (e) {
    return {
      username: username ?? "",
      self: !username,
      followers: 0,
      mediaTotal: 0,
      posts: 0,
      likes: 0,
      comments: 0,
      avgInter: 0,
      postsPerWeek: 0,
      engajamento: 0,
      byWeekday: Array(7).fill(0),
      byHour: Array(8).fill(0),
      hashtags: [],
      best: [],
      worst: [],
      error: e instanceof Error ? e.message : "falha",
    };
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function competitorReport(brandId: string, days = 30, force = false): Promise<Report | { error: string }> {
  const brand = await getBrandById(brandId);
  if (!brand) return { error: "marca inválida" };
  const acc = resolveIg(brand);
  if (!acc) return { error: "sem conta Instagram conectada nesta marca" };

  if (!force) {
    const [cached] = await sql<{ payload: Report; created_at: string }[]>`
      select payload, created_at from report_cache where brand_id=${brandId} and days=${days}`;
    if (cached && Date.now() - new Date(cached.created_at).getTime() < 6 * 3600_000) return cached.payload;
  }

  const comps = (await listSources(brandId)).filter((s) => s.kind === "competitor").slice(0, 5);
  const [self, ...competitors] = await Promise.all([
    fetchStats(acc, null, days),
    ...comps.map((c) => fetchStats(acc, c.value, days)),
  ]);

  const report: Report = { self, competitors, days, generatedAt: new Date().toISOString() };
  await sql`insert into report_cache (brand_id, days, payload) values (${brandId}, ${days}, ${sql.json(report as never)})
    on conflict (brand_id, days) do update set payload=excluded.payload, created_at=now()`;
  return report;
}
