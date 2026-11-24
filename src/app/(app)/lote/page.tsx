import { planejarLote } from "@/server/lote";
import { PageHeader, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/ui";
import { agendarLote } from "./actions";

export const dynamic = "force-dynamic";

const CALENDARIO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

const AGENDAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4 4 10-10" />
  </svg>
);

const ALERTA = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4 2.8 19.5h18.4L12 4z" />
    <path d="M12 10v4M12 17.2h.01" />
  </svg>
);

// D19: lote de agendamento. Distribui os rascunhos prontos em horarios livres da janela
// de cada marca e mostra o plano para revisar antes de agendar.
export default async function LotePage() {
  const { plano, semJanela } = await planejarLote();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lote"
        subtitle={`${plano.length} ${plano.length === 1 ? "post" : "posts"} para distribuir`}
        action={
          plano.length > 0 ? (
            <form action={agendarLote}>
              <input type="hidden" name="plano" value={JSON.stringify(plano.map((p) => ({ id: p.id, quando: p.quando })))} />
              <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-warn px-4 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">
                {AGENDAR}
                Agendar {plano.length}
              </button>
            </form>
          ) : undefined
        }
      />

      {semJanela.length > 0 && (
        <p className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          {ALERTA}
          <span>
            {semJanela.join(", ")} sem janela de publicação configurada. Os posts dessas marcas ficam de fora do lote.
          </span>
        </p>
      )}

      {plano.length === 0 ? (
        <Empty title="Nada para distribuir" hint="O lote usa rascunhos que já têm arte e ainda não têm data." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-panel">
          <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,10rem)_minmax(0,1fr)] gap-4 border-b border-line bg-panel2/50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
            <span className="flex items-center gap-2">{CALENDARIO}Quando</span>
            <span>Marca</span>
            <span>Legenda</span>
          </div>
          <ul>
            {plano.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[minmax(0,11rem)_minmax(0,10rem)_minmax(0,1fr)] items-center gap-4 border-b border-line/60 px-5 py-3.5 text-sm last:border-b-0"
              >
                <span className="font-mono text-xs font-semibold text-warn">{fmtDate(p.quando)}</span>
                <span className="flex min-w-0 items-center gap-2.5 text-dim">
                  <span aria-hidden className="h-6 w-1 shrink-0 rounded-full" style={{ background: p.cor }} />
                  <span className="truncate">{p.nome}</span>
                </span>
                <span className="truncate text-ink">{p.legenda?.trim() || "(sem legenda)"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
