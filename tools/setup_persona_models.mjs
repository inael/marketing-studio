// Adiciona modelo+skills nas personas e atribui um modelo real (testado) por persona.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
const env = {};
for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}
const BASE = "https://api.usetokia.com/v1";
const FALLBACK = "gpt-4o-mini";
const MAP = {
  "Bruno Nogueira": { model: "deepseek-v3", skills: "pesquisa de tendências, análise de dados, checagem de fontes" },
  "Carla Menezes": { model: "gpt-4o", skills: "copywriting criativo, ganchos virais, formatos de reels" },
  "Diego Prado": { model: "gemini-pro", skills: "estratégia de conversão, CTA, funil de vendas" },
  "Marina Alves": { model: "claude-sonnet-46", skills: "curadoria editorial, consistência de marca, gestão de calendário, feedback de time" },
};

async function modelOk(m) {
  try {
    const r = await fetch(`${BASE}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.USETOKIA_API_KEY}` }, body: JSON.stringify({ model: m, messages: [{ role: "user", content: "ok" }], max_tokens: 5 }) });
    return r.ok;
  } catch { return false; }
}

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
try {
  await sql`alter table personas add column if not exists modelo text default ''`;
  await sql`alter table personas add column if not exists skills text default ''`;
  for (const [nome, cfg] of Object.entries(MAP)) {
    const ok = await modelOk(cfg.model);
    const model = ok ? cfg.model : FALLBACK;
    await sql`update personas set modelo=${model}, skills=${cfg.skills} where nome=${nome}`;
    console.log(`${nome}: modelo=${model}${ok ? "" : " (fallback, candidato falhou)"}`);
  }
} finally { await sql.end(); }
