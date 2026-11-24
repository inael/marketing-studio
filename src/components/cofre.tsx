import { salvarSegredo, removerSegredo } from "@/app/(app)/config/cofre-actions";
import { COFRE_ITENS, chaveCofre, lerRegistro } from "@/server/cofre";
import { inputCls, btnGhost } from "@/components/ui";

// D40: cofre por marca. So mostra se o valor esta guardado; nunca o valor.
export function Cofre({ marcas, settings }: { marcas: { slug: string; nome: string }[]; settings: Record<string, string> }) {
  const registro = lerRegistro(settings).slice(0, 5);
  return (
    <section id="cofre" className="mb-8 w-full space-y-5 rounded-xl border border-line bg-panel/50 p-6">
      <h2 className="text-sm font-semibold text-ink">Cofre por marca</h2>
      <p className="text-xs text-dim">
        Senhas e chaves ficam guardadas e nunca são mostradas de volta. Para trocar, digite um novo valor.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
      {marcas.map((m) => (
        <div key={m.slug} className="min-w-0 rounded-xl border border-line bg-panel p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel2 text-warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg></span>
            <span className="text-sm font-semibold text-ink">{m.nome}</span>
          </div>
          <ul className="space-y-3">
            {COFRE_ITENS.map((item) => {
              const ok = Boolean(settings[chaveCofre(m.slug, item)]);
              return (
                <li key={item} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="min-w-44 text-dim">{item}</span>
                  <span className={ok ? "text-ok" : "text-faint"}>
                    {ok ? `•••• ${settings[`${chaveCofre(m.slug, item)}.ult4`] ?? ""} · criado em ${settings[`${chaveCofre(m.slug, item)}.criado`] ? new Date(settings[`${chaveCofre(m.slug, item)}.criado`]).toLocaleDateString("pt-BR") : "-"}` : "não configurado"}
                  </span>
                  <form action={salvarSegredo} className="ml-auto flex gap-1.5">
                    <input type="hidden" name="slug" value={m.slug} />
                    <input type="hidden" name="item" value={item} />
                    <input name="valor" type="password" autoComplete="new-password" placeholder="novo valor" className={`${inputCls} w-40 text-xs`} />
                    <button className={btnGhost}>Salvar</button>
                  </form>
                  {ok && (
                    <form action={removerSegredo}>
                      <input type="hidden" name="slug" value={m.slug} />
                      <input type="hidden" name="item" value={item} />
                      <button className="text-xs text-bad hover:underline">remover</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-wide text-faint">Últimas alterações</div>
        {registro.length === 0 ? (
          <p className="mt-1 text-xs text-faint">Nenhuma alteração ainda.</p>
        ) : (
          <ul className="mt-1 space-y-1 text-xs text-dim">
            {registro.map((r, i) => (
              <li key={i}>
                {new Date(r.quando).toLocaleString("pt-BR")} · {r.autor ?? "alguém"} {r.acao} &ldquo;{r.item}&rdquo; em @{r.marca}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
