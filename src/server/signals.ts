import type { IgAccount } from "./graph";

// ---- RSS ----
function tagText(block: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i").exec(block);
  if (!m) return "";
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type RssItem = { title: string; summary: string; link: string };

export async function fetchRss(url: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MarketingStudio" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];
    return blocks
      .slice(0, 8)
      .map((b) => ({
        title: tagText(b, "title"),
        summary: (tagText(b, "description") || tagText(b, "summary") || tagText(b, "content")).slice(0, 240),
        link: /<link[^>]*href=["']([^"']+)["']/i.exec(b)?.[1] || tagText(b, "link"),
      }))
      .filter((i) => i.title);
  } catch {
    return [];
  }
}

// ---- Concorrentes (Instagram business_discovery) ----
export type CompetitorPost = { caption: string; likes: number; comments: number; permalink?: string };

export async function competitorTopPosts(
  acc: IgAccount,
  username: string,
  n = 3
): Promise<CompetitorPost[]> {
  try {
    const fields = `business_discovery.username(${username}){media.limit(15){caption,like_count,comments_count,permalink,media_type}}`;
    const url = `https://graph.facebook.com/v21.0/${acc.igUserId}?fields=${encodeURIComponent(
      fields
    )}&access_token=${encodeURIComponent(acc.token)}`;
    const res = await fetch(url);
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const media: any[] = data?.business_discovery?.media?.data ?? [];
    return media
      .map((m) => ({
        caption: m.caption ?? "",
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        permalink: m.permalink,
      }))
      .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
      .slice(0, n);
  } catch {
    return [];
  }
}
