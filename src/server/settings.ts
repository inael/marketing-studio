import { sql } from "./db";

// Config global do workspace (key-value). Secrets ficam aqui e nunca voltam
// pra UI (write-only): a tela só mostra se está "configurado".

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await sql<{ key: string; value: string }[]>`select key, value from app_settings`;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSettings(
  patch: Record<string, string | null | undefined>
): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue; // não mexe
    if (value === null) {
      await sql`delete from app_settings where key = ${key}`;
      continue;
    }
    await sql`insert into app_settings (key, value) values (${key}, ${value})
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
  }
}

export type AiConfig = { provider: string; baseUrl: string; apiKey: string; model: string };

/** provedor de texto ativo (OpenAI-compatível: UseTokia ou LiteLLM) */
export async function getAiConfig(
  settings?: Record<string, string>
): Promise<AiConfig | null> {
  const s = settings ?? (await getSettings());
  const provider = s.ai_provider || "usetokia";
  const baseUrl = s[`${provider}_base_url`];
  const apiKey = s[`${provider}_api_key`];
  const model = s[`${provider}_model`] || "claude-sonnet-4-6";
  if (!baseUrl || !apiKey) return null;
  return { provider, baseUrl, apiKey, model };
}

export async function getHiggsfieldKey(
  settings?: Record<string, string>
): Promise<string | null> {
  const s = settings ?? (await getSettings());
  return s.higgsfield_api_key || null;
}

export type ElevenConfig = { apiKey: string; voiceId: string };
export async function getElevenLabsConfig(
  settings?: Record<string, string>
): Promise<ElevenConfig | null> {
  const s = settings ?? (await getSettings());
  if (!s.elevenlabs_api_key) return null;
  return { apiKey: s.elevenlabs_api_key, voiceId: s.elevenlabs_voice_id || "21m00Tcm4TlvDq8ikWAM" };
}
