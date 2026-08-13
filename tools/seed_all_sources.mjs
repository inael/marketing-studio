// Testa e semeia fontes (RSS + concorrentes) por marca. Idempotente. Sem segredos impressos.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const env = {};
for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}

const R = {
  canaltech: "https://canaltech.com.br/rss/",
  olhardigital: "https://olhardigital.com.br/feed/",
  rockcontent: "https://rockcontent.com/br/blog/feed/",
  neofeed: "https://neofeed.com.br/feed/",
};

const BRANDS = {
  freelancego: { rss: [R.rockcontent, R.neofeed, "https://blog.workana.com/pt/feed/"], comp: ["workana", "99freelas", "getninjas", "trampos.co", "freelancer", "vinco"] },
  darkemail: { rss: [R.canaltech, R.olhardigital, "https://thehack.com.br/feed/"], comp: ["proton", "protonmail", "nordvpn", "kasperskybrasil", "avastbrasil", "mullvadvpn"] },
  jetsend: { rss: [R.rockcontent, R.neofeed], comp: ["mailchimp", "activecampaign", "brevo", "leadlovers", "egoi", "rdstation"] },
  simpleszap: { rss: [R.rockcontent, R.canaltech], comp: ["zenvia", "huggy", "manychat", "blip", "take.blip", "weni.ai"] },
  usetokia: { rss: [R.canaltech, R.olhardigital, R.neofeed], comp: ["openai", "jasper", "copy.ai", "runwayml", "midjourney", "perplexity.ai"] },
  recapitule: { rss: [R.canaltech, R.neofeed], comp: ["fireflies.ai", "otter.ai", "fathom.video", "tldv", "grain", "read.ai"] },
  assinaagora: { rss: [R.neofeed, R.rockcontent], comp: ["docusign", "clicksign", "d4sign", "zapsign", "autentique"] },
};

async function rssOk(url) {
  try { const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MarketingStudio" }, redirect: "follow" }); if (!r.ok) return false; const x = await r.text(); return (x.match(/<(item|entry)[\s>]/gi) || []).length >= 2; } catch { return false; }
}
const IG = env.META_ITBOOSTER_IG_USER_ID, TOK = env.META_ITBOOSTER_ACCESS_TOKEN;
async function compOk(u) {
  try { const f = `business_discovery.username(${u}){media.limit(2){like_count}}`; const url = `https://graph.facebook.com/v21.0/${IG}?fields=${encodeURIComponent(f)}&access_token=${encodeURIComponent(TOK)}`; const d = await (await fetch(url)).json(); return Array.isArray(d?.business_discovery?.media?.data); } catch { return false; }
}

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
try {
  for (const [slug, cfg] of Object.entries(BRANDS)) {
    const [brand] = await sql`select id from brands where slug=${slug}`;
    if (!brand) { console.log(slug, "- marca nao encontrada"); continue; }
    const okRss = []; for (const u of [...new Set(cfg.rss)]) if (await rssOk(u)) okRss.push(u);
    const okComp = []; for (const c of cfg.comp) if (await compOk(c)) okComp.push(c);
    for (const v of okRss) await sql`insert into content_sources (brand_id, kind, value) values (${brand.id}, 'rss', ${v}) on conflict do nothing`;
    for (const v of okComp) await sql`insert into content_sources (brand_id, kind, value) values (${brand.id}, 'competitor', ${v}) on conflict do nothing`;
    console.log(`${slug}: rss=${okRss.length} comp=[${okComp.join(", ")}]`);
  }
} finally { await sql.end(); }
