const GRAPH = "https://graph.facebook.com/v21.0";
export type IgAccount = { igUserId: string; token: string };

async function graphCall(token: string, method: "GET" | "POST", path: string, params: Record<string, string>) {
  const usp = new URLSearchParams({ ...params, access_token: token });
  const url = method === "GET" ? `${GRAPH}/${path}?${usp}` : `${GRAPH}/${path}`;
  const res = await fetch(url, method === "GET" ? {} : { method: "POST", body: usp });
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function waitReady(token: string, containerId: string, attempts = 30, sleepMs = 3000) {
  for (let i = 0; i < attempts; i++) {
    const s = await graphCall(token, "GET", containerId, { fields: "status_code" });
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new Error(`container ERROR: ${JSON.stringify(s)}`);
    await new Promise((r) => setTimeout(r, sleepMs));
  }
  throw new Error(`container ${containerId} nao ficou pronto`);
}

async function publishSingle(acc: IgAccount, imageUrl: string, caption: string) {
  const c = await graphCall(acc.token, "POST", `${acc.igUserId}/media`, { image_url: imageUrl, caption });
  await waitReady(acc.token, c.id, 20);
  const r = await graphCall(acc.token, "POST", `${acc.igUserId}/media_publish`, { creation_id: c.id });
  return r.id as string;
}

async function publishCarousel(acc: IgAccount, imageUrls: string[], caption: string) {
  const children: string[] = [];
  for (const u of imageUrls) {
    const c = await graphCall(acc.token, "POST", `${acc.igUserId}/media`, { image_url: u, is_carousel_item: "true" });
    children.push(c.id);
  }
  const parent = await graphCall(acc.token, "POST", `${acc.igUserId}/media`, {
    media_type: "CAROUSEL", children: children.join(","), caption,
  });
  await waitReady(acc.token, parent.id, 30);
  const r = await graphCall(acc.token, "POST", `${acc.igUserId}/media_publish`, { creation_id: parent.id });
  return r.id as string;
}

export async function publishImages(acc: IgAccount, imageUrls: string[], caption: string) {
  if (imageUrls.length === 0) throw new Error("nenhuma imagem");
  const mediaId = imageUrls.length === 1
    ? await publishSingle(acc, imageUrls[0], caption)
    : await publishCarousel(acc, imageUrls, caption);
  let permalink: string | null = null;
  try {
    const info = await graphCall(acc.token, "GET", mediaId, { fields: "permalink" });
    permalink = info.permalink ?? null;
  } catch { /* best-effort */ }
  return { mediaId, permalink };
}
