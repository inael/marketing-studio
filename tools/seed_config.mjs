// Pre-preenche app_settings com as secrets do vault (como se preenchidas no Config).
// Editavel depois pela tela de Config. Nao imprime valores.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const env = {};
for (const l of readFileSync(path.join(os.homedir(), ".claude/credentials/services.env"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i > 0 && !l.startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
}

const MODEL = env.USETOKIA_MODEL || "gpt-4o-mini";
// so grava o que existe (valores vazios sao ignorados)
const settings = {
  ai_provider: "usetokia",
  usetokia_base_url: "https://api.usetokia.com/v1",
  usetokia_api_key: env.USETOKIA_API_KEY,
  usetokia_model: MODEL,
  litellm_base_url: "https://litellm.toolpad.cloud/v1",
  litellm_api_key: env.USETOKIA_API_KEY, // mesma chave funciona no LiteLLM publico
  litellm_model: MODEL,
  elevenlabs_api_key: env.ELEVENLABS_API_KEY,
  elevenlabs_voice_id: "21m00Tcm4TlvDq8ikWAM",
  higgsfield_model: "higgsfield-ai/soul/standard", // key+secret o Inael adiciona depois
};

const sql = postgres(env.MARKETING_STUDIO_DATABASE_URL, { ssl: false });
try {
  const set = [];
  for (const [k, v] of Object.entries(settings)) {
    if (!v) continue;
    await sql`insert into app_settings (key, value) values (${k}, ${v})
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
    set.push(k);
  }
  console.log("gravados:", set.join(", "));
  const rows = await sql`select key from app_settings order by key`;
  console.log("app_settings agora:", rows.map((r) => r.key).join(", "));
} finally {
  await sql.end();
}
