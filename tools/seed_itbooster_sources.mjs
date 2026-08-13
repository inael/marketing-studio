// Testa candidatos de RSS e concorrentes (IG business_discovery) e cadastra os
// que funcionam na marca itbooster. Idempotente. Nao imprime segredos.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const env = {};
for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i > 0 && !l.startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}

const RSS = [
  "https://canaltech.com.br/rss/",
  "https://olhardigital.com.br/feed/",
  "https://www.tecmundo.com.br/rss",
  "https://resultadosdigitais.com.br/blog/feed/",
  "https://rockcontent.com/br/blog/feed/",
  "https://www.ecommercebrasil.com.br/feed",
  "https://neofeed.com.br/feed/",
  "https://startse.com/feed/",
];
const COMPETITORS = [
  "rdstation", "rockcontent", "mlabs", "etus.midia", "hotmart",
  "nuvemshop", "contaazul", "agendor", "leadster", "zenvia",
];

async function rssOk(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MarketingStudio" }, redirect: "follow" });
    if (!r.ok) return false;
    const xml = await r.text();
    return (xml.match(/<(item|entry)[\s>]/gi) || []).length >= 2;
  } catch { return false; }
}

const IG = env.META_ITBOOSTER_IG_USER_ID;
const TOK = env.META_ITBOOSTER_ACCESS_TOKEN;
async function competitorOk(u) {
  if (!IG || !TOK) return { ok: false, why: "sem token itbooster" };
  try {
    const fields = `business_discovery.username(${u}){media.limit(3){like_count}}`;
    const url = `https://graph.facebook.com/v21.0/${IG}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(TOK)}`;
    const r = await fetch(url);
    const d = await r.json();
    const media = d?.business_discovery?.media?.data;
    if (Array.isArray(media)) return { ok: true, n: media.length };
    return { ok: false, why: d?.error?.message?.slice(0, 60) || "sem dados" };
  } catch (e) { return { ok: false, why: e.message }; }
}

const okRss = [];
for (const u of RSS) { if (await rssOk(u)) { okRss.push(u); console.log("RSS  OK  ", u); } else console.log("RSS  FAIL", u); }
const okComp = [];
for (const c of COMPETITORS) { const r = await competitorOk(c); if (r.ok) { okComp.push(c); console.log("COMP OK  ", c, `(${r.n})`); } else console.log("COMP FAIL", c, "-", r.why); }

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
try {
  const [brand] = await sql`select id from brands where slug='itbooster' limit 1`;
  if (!brand) { console.log("marca itbooster nao encontrada"); process.exit(1); }
  for (const v of okRss)
    await sql`insert into content_sources (brand_id, kind, value) values (${brand.id}, 'rss', ${v}) on conflict do nothing`;
  for (const v of okComp)
    await sql`insert into content_sources (brand_id, kind, value) values (${brand.id}, 'competitor', ${v}) on conflict do nothing`;
  const rows = await sql`select kind, count(*) as n from content_sources where brand_id=${brand.id} group by kind`;
  console.log("cadastrado:", rows.map((r) => `${r.kind}=${r.n}`).join(", "));
} finally { await sql.end(); }
