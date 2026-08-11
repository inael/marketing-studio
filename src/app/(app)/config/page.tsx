import { getSettings } from "@/server/settings";
import { saveConfig } from "./actions";
import { PageHeader, btnPrimary, inputCls, labelCls } from "@/components/ui";

export const dynamic = "force-dynamic";

function SecretHint({ set }: { set: boolean }) {
  return set ? (
    <span className="text-xs text-ok">configurado — deixe em branco pra manter</span>
  ) : (
    <span className="text-xs text-faint">não configurado</span>
  );
}

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const [{ ok }, s] = await Promise.all([searchParams, getSettings()]);
  const provider = s.ai_provider || "usetokia";

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Integrações de IA e credenciais do estúdio"
      />

      {ok && (
        <p className="mb-6 rounded-md border border-ok/30 bg-ok/5 px-3 py-2 text-sm text-ok">
          Configurações salvas.
        </p>
      )}

      <form action={saveConfig} className="max-w-2xl space-y-8">
        {/* IA de texto */}
        <section className="space-y-5 rounded-lg border border-line bg-panel/50 p-6">
          <div>
            <h2 className="text-sm font-semibold text-ink">IA de texto (legenda)</h2>
            <p className="mt-1 text-xs text-dim">
              Provedor OpenAI-compatível usado pra gerar/reescrever legendas com o tom de voz da marca.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { v: "usetokia", label: "UseTokia" },
              { v: "litellm", label: "LiteLLM" },
            ].map((p) => (
              <label
                key={p.v}
                className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-dim has-[:checked]:border-line2 has-[:checked]:text-ink"
              >
                <input
                  type="radio"
                  name="ai_provider"
                  value={p.v}
                  defaultChecked={provider === p.v}
                  className="accent-ink"
                />
                {p.label} ativo
              </label>
            ))}
          </div>

          <div className="space-y-4 rounded-md border border-line p-4">
            <div className="font-mono text-xs text-faint">UseTokia</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="usetokia_base_url">Base URL</label>
                <input id="usetokia_base_url" name="usetokia_base_url" defaultValue={s.usetokia_base_url ?? ""} placeholder="https://api.usetokia.com/v1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="usetokia_model">Modelo</label>
                <input id="usetokia_model" name="usetokia_model" defaultValue={s.usetokia_model ?? ""} placeholder="claude-sonnet-4-6" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="usetokia_api_key">API key</label>
              <input id="usetokia_api_key" name="usetokia_api_key" type="password" autoComplete="off" placeholder="sk-…" className={`${inputCls} font-mono`} />
              <div className="mt-1"><SecretHint set={Boolean(s.usetokia_api_key)} /></div>
            </div>
          </div>

          <div className="space-y-4 rounded-md border border-line p-4">
            <div className="font-mono text-xs text-faint">LiteLLM</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="litellm_base_url">Base URL</label>
                <input id="litellm_base_url" name="litellm_base_url" defaultValue={s.litellm_base_url ?? ""} placeholder="https://litellm.itbooster.com.br/v1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="litellm_model">Modelo</label>
                <input id="litellm_model" name="litellm_model" defaultValue={s.litellm_model ?? ""} placeholder="claude-sonnet-4-6" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="litellm_api_key">API key</label>
              <input id="litellm_api_key" name="litellm_api_key" type="password" autoComplete="off" placeholder="sk-…" className={`${inputCls} font-mono`} />
              <div className="mt-1"><SecretHint set={Boolean(s.litellm_api_key)} /></div>
            </div>
          </div>
        </section>

        {/* Higgsfield */}
        <section className="space-y-4 rounded-lg border border-line bg-panel/50 p-6">
          <div>
            <h2 className="text-sm font-semibold text-ink">Higgsfield (imagem)</h2>
            <p className="mt-1 text-xs text-dim">
              API key pra gerar imagens dos posts direto no estúdio.
            </p>
          </div>
          <div>
            <label className={labelCls} htmlFor="higgsfield_api_key">API key</label>
            <input id="higgsfield_api_key" name="higgsfield_api_key" type="password" autoComplete="off" placeholder="hf-…" className={`${inputCls} font-mono`} />
            <div className="mt-1"><SecretHint set={Boolean(s.higgsfield_api_key)} /></div>
          </div>
        </section>

        {/* ElevenLabs */}
        <section className="space-y-4 rounded-lg border border-line bg-panel/50 p-6">
          <div>
            <h2 className="text-sm font-semibold text-ink">ElevenLabs (narração)</h2>
            <p className="mt-1 text-xs text-dim">
              API key e voz padrão pra narrar reels e vídeos quando precisar.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="elevenlabs_api_key">API key</label>
              <input id="elevenlabs_api_key" name="elevenlabs_api_key" type="password" autoComplete="off" placeholder="sk_…" className={`${inputCls} font-mono`} />
              <div className="mt-1"><SecretHint set={Boolean(s.elevenlabs_api_key)} /></div>
            </div>
            <div>
              <label className={labelCls} htmlFor="elevenlabs_voice_id">Voice ID <span className="text-faint">(opcional)</span></label>
              <input id="elevenlabs_voice_id" name="elevenlabs_voice_id" defaultValue={s.elevenlabs_voice_id ?? ""} placeholder="21m00Tcm4TlvDq8ikWAM" className={`${inputCls} font-mono`} />
            </div>
          </div>
        </section>

        <button type="submit" className={btnPrimary}>
          Salvar configurações
        </button>
      </form>
    </>
  );
}
