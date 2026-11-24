import { salvarSegredo, removerSegredo } from "@/app/(app)/config/cofre-actions";
import { COFRE_ITENS, chaveCofre, lerRegistro } from "@/server/cofre";
import { inputCls, btnGhost } from "@/components/ui";

// D40: cofre por marca. So mostra se o valor esta guardado; nunca o valor.
export function Cofre({ marcas, settings }: { marcas: { slug: string; nome: string }[]; settings: Record<string, string> }) {
  const registro = lerRegistro(settings).slice(0, 5);
  return (
    <section id="cofre" className="mb-8 max-w-3xl space-y-4 rounded-lg border border-line bg-panel/50 p-6">
      <h2 className="text-sm font-semibold text-ink">Cofre por marca</h2>
      <p className="text-xs text-dim">
        Senhas e chaves ficam guardadas e nunca são mostradas de volta. Para trocar, digite um novo valor.
      </p>

      {marcas.map((m) => (
        <div key={m.slug} className="rounded-md border border-line p-4">
          <div className="mb-3 text-sm font-medium text-ink">{m.nome}</div>
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
