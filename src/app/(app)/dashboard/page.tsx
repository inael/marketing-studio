import Link from "next/link";
import { dashboardSummary } from "@/server/dashboard";
import { PageHeader } from "@/components/ui";
import { TIPO, fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

function Stat({ label, value, href, tone }: { label: string; value: number; href?: string; tone?: string }) {
  const body = (
    <div className="rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line2">
      <div className={`text-2xl font-semibold ${tone ?? "text-ink"}`}>{value}</div>
      <div className="mt-0.5 text-xs text-dim">{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function DashboardPage() {
  const d = await dashboardSummary();

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral de todos os produtos" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Rascunhos" value={d.posts.draft ?? 0} href="/posts" tone="text-warn" />
        <Stat label="Agendados" value={d.posts.scheduled ?? 0} href="/posts" />
        <Stat label="Publicados (7d)" value={d.publishedWeek} href="/posts" tone="text-ok" />
        <Stat label="Sugestões salvas" value={d.suggestions} href="/sugestoes" tone="text-info" />
        <Stat label="Marcas ativas" value={d.brandsAtivas} href="/marcas" />
        <Stat label="Excluídos" value={d.deleted} tone="text-faint" />
      </div>

      {/* automação */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel/50 px-4 py-3 text-xs">
        <span className="font-medium text-dim">Piloto automático:</span>
        <span className={d.automation.sugestoes ? "text-ok" : "text-faint"}>
          {d.automation.sugestoes ? "● sugestões 8h ligadas" : "○ sugestões 8h desligadas"}
        </span>
        <span className={d.automation.gestor ? "text-ok" : "text-faint"}>
          {d.automation.gestor ? "● gestor publica 9h" : "○ gestor 9h desligado"}
        </span>
        <Link href="/config" className="ml-auto text-info hover:underline">
          ajustar em Config
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* coluna esquerda: pendências + agenda */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Aguardando aprovação</h2>
            {d.pendingByBrand.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
                Nada pendente. 🎉
              </p>
            ) : (
              <ul className="space-y-2">
                {d.pendingByBrand.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href="/posts"
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-4 py-2.5 transition-colors hover:border-line2"
                    >
                      <span className="flex items-center gap-2 text-sm text-ink">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.cor }} />
                        {p.nome}
                      </span>
                      <span className="text-xs text-warn">{p.drafts} rascunho(s)</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Próximas publicações</h2>
            {d.nextScheduled.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
                Nenhuma publicação agendada.
              </p>
            ) : (
              <ul className="space-y-2">
                {d.nextScheduled.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.cor }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {p.legenda?.trim() || "(sem legenda)"}
                      </span>
                      <span className="text-[11px] text-faint">
                        @{p.slug} · {TIPO[p.tipo] ?? p.tipo}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-warn">{fmtDate(p.scheduled_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* coluna direita: conexões */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Conexões por marca</h2>
            <Link href="/marcas" className="text-xs text-info hover:underline">
              gerenciar
            </Link>
          </div>
          <ul className="space-y-2">
            {d.connections.map((c) => (
              <li
                key={c.slug}
                className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5"
              >
                {c.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: c.cor }} />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.nome}</span>
                <span className={`text-[11px] ${c.ig ? "text-ok" : "text-faint"}`}>IG</span>
                <span className={`text-[11px] ${c.linkedin ? "text-ok" : "text-faint"}`}>in</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
