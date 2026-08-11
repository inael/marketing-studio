// Grava higgsfield key+secret no app_settings (do vault) e testa a API.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const env = {};
for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i > 0 && !l.startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}
const key = env.HIGGSFIELD_API_KEY;
const secret = env.HIGGSFIELD_API_SECRET;
if (!key || !secret) { console.log("sem key/secret no vault"); process.exit(1); }

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
for (const [k, v] of [["higgsfield_api_key", key], ["higgsfield_api_secret", secret]]) {
  await sql`insert into app_settings (key, value) values (${k}, ${v})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}
await sql.end();
console.log("gravado: higgsfield_api_key + higgsfield_api_secret");

// teste real
const auth = `Key ${key}:${secret}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const r = await fetch("https://platform.higgsfield.ai/higgsfield-ai/soul/standard", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ prompt: "a red apple on a wooden table, clean product photo", aspect_ratio: "1:1" }),
  });
  const txt = await r.text();
  console.log("SUBMIT:", r.status, txt.slice(0, 300).replace(/\s+/g, " "));
  let data; try { data = JSON.parse(txt); } catch {}
  if (data?.status_url) {
    await sleep(6000);
    const s = await fetch(data.status_url, { headers: { Authorization: auth, Accept: "application/json" } });
    console.log("POLL:", s.status, (await s.text()).slice(0, 300).replace(/\s+/g, " "));
  }
} catch (e) {
  console.log("ERRO:", e.message);
}
