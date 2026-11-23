import { planejarLote } from "@/server/lote";
import { PageHeader, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/ui";
import { agendarLote } from "./actions";

export const dynamic = "force-dynamic";

// D19: lote de agendamento. Distribui os rascunhos prontos em horarios livres da janela
// de cada marca e mostra o plano para revisar antes de agendar.
export default async function LotePage() {
  const { plano, semJanela } = await planejarLote();

  return (
    <>
      <PageHeader
        title="Lote"
        subtitle={`${plano.length} ${plano.length === 1 ? "post" : "posts"} para distribuir`}
        action={
          plano.length > 0 ? (
            <form action={agendarLote}>
              <input type="hidden" name="plano" value={JSON.stringify(plano.map((p) => ({ id: p.id, quando: p.quando })))} />
              <button type="submit" className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-canvas transition-opacity hover:opacity-90">
                Agendar {plano.length}
              </button>
            </form>
          ) : undefined
        }
      />

      {semJanela.length > 0 && (
        <p className="mb-4 rounded-md border border-warn/30 px-3 py-2 text-xs text-warn">
          {semJanela.join(", ")} sem janela de publicação configurada. Os posts dessas marcas ficam de fora do lote.
        </p>
      )}

      {plano.length === 0 ? (
        <Empty
          title="Nada para distribuir"
          hint="O lote usa rascunhos que já têm arte e ainda não têm data."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[10rem_9rem_1fr] border-b border-line bg-panel px-4 py-2 text-xs font-medium text-faint">
            <span>Quando</span>
            <span>Marca</span>
            <span>Legenda</span>
          </div>
          <ul>
            {plano.map((p) => (
              <li key={p.id} className="grid grid-cols-[10rem_9rem_1fr] items-center border-b border-line px-4 py-2.5 text-sm last:border-b-0">
                <span className="text-warn">{fmtDate(p.quando)}</span>
                <span className="flex items-center gap-2 text-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.cor }} />
                  {p.nome}
                </span>
                <span className="truncate text-ink">{p.legenda?.trim() || "(sem legenda)"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
