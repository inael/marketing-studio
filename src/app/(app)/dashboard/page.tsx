import Link from "next/link";
import { dashboardSummary, type WeeklyCard, type DashboardData } from "@/server/dashboard";
import { PageHeader, btnGhost, btnPrimary } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { TIPO, fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

// Faixa discreta de numeros da semana (D01: contexto, nao leitura principal).
function WeeklyStrip({ cards }: { cards: WeeklyCard[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-line bg-panel/50 px-4 py-2.5 text-xs">
      {cards.map((c) => {
        const diff = c.atual - c.anterior;
        const up = diff > 0;
        const same = diff === 0;
        const good = same ? null : up === c.goodWhenUp;
        const tone = same ? "text-dim" : good ? "text-ok" : "text-bad";
        const arrow = same ? "•" : up ? "▲" : "▼";
        return (
          <Link key={c.key} href={c.href} className="flex items-baseline gap-1.5 hover:underline">
            <span className="text-base font-semibold text-ink">{c.atual}</span>
            <span className="text-dim">{c.label.toLowerCase()}</span>
            <span className={`font-medium ${tone}`}>
              {arrow} {diff > 0 ? "+" : ""}
              {diff}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

const TIPO_PENDENCIA: Record<string, string> = {
  falha: "text-bad",
  conexao: "text-warn",
  rascunho: "text-info",
};

function Rede({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      title={on ? `${label}: conectado` : `${label}: não conectado`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        on ? "border-ok/30 bg-ok/10 text-ok" : "border-line bg-panel2 text-faint"
      }`}
    >
      <span aria-hidden>{on ? "✓" : "○"}</span>
      {label}
    </span>
  );
}

// D35: alertas em tres faixas, cada uma com a acao que resolve
const FAIXAS = [
  { tipo: "falha", titulo: "Urgente", acao: "Ver posts com erro", href: "/posts?status=failed" },
  { tipo: "conexao", titulo: "Atenção", acao: "Reconectar contas", href: "/marcas?filtro=pendencia" },
  { tipo: "rascunho", titulo: "Para revisar", acao: "Abrir aprovação", href: "/aprovacao" },
] as const;

// D02: meta da semana: barra com o publicado e o agendado; a semana anterior vira marca fina
function MetaSemana({ meta }: { meta: DashboardData["meta"] }) {
  const feito = meta.publicados + meta.agendados;
  const pct = (v: number) => Math.min(100, Math.round((v / Math.max(1, meta.total)) * 100));
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-ink">Meta da semana: {meta.total} posts</div>
        <div className="text-xs text-faint">{meta.porMarca} por marca</div>
      </div>
      <div className="relative mt-3 h-3 overflow-hidden rounded bg-panel2">
        <div className="absolute inset-y-0 left-0 bg-info/40" style={{ width: `${pct(feito)}%` }} />
        <div className="absolute inset-y-0 left-0 bg-info" style={{ width: `${pct(meta.publicados)}%` }} />
        <div className="absolute inset-y-0 w-px bg-faint" style={{ left: `${pct(meta.anteriorPublicados)}%` }} title="semana anterior" />
      </div>
      <div className="mt-2 text-xs text-dim">{meta.publicados} publicados + {meta.agendados} agendados de {meta.total}</div>
    </section>
  );
}

export default async function DashboardPage() {
  const d = await dashboardSummary();
  const hoje = new Date();
  const mesmoDia = (iso: string) => {
    const x = new Date(iso);
    return x.getDate() === hoje.getDate() && x.getMonth() === hoje.getMonth() && x.getFullYear() === hoje.getFullYear();
  };
  const agendaHoje = d.nextScheduled.filter((p) => mesmoDia(p.scheduled_at));
  const agenda = agendaHoje.length > 0 ? agendaHoje : d.nextScheduled.slice(0, 3);
  const rotuloAgenda = agendaHoje.length > 0 ? "Agenda de hoje" : "Próximas publicações";
  const data = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const n = d.pendencias.length;

  // D02: frase que explica a alta de rascunhos e aponta de quais marcas eles sao.
  const rasc = d.weekly.find((c) => c.key === "rascunhos");
  const subiu = rasc && rasc.atual > rasc.anterior;
  const pct = rasc && rasc.anterior > 0 ? Math.round(((rasc.atual - rasc.anterior) / rasc.anterior) * 100) : null;
  const totalRasc = d.pendingByBrand.reduce((s, p) => s + p.drafts, 0);
  const topo = d.pendingByBrand.slice(0, 2);
  const somaTopo = topo.reduce((s, p) => s + p.drafts, 0);
  const nomesTopo = topo.map((p) => p.nome).join(" e ");

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={data.charAt(0).toUpperCase() + data.slice(1)}
        action={
          <div className="flex gap-2">
            <Link href="/calendario" className={btnGhost}>
              Ver calendário
            </Link>
            <Link href="/criar" className={btnPrimary}>
              + Criar post
            </Link>
          </div>
        }
      />

      <p className="mb-3 text-sm text-dim">
        {n === 0 ? "Nada bloqueando as publicações de hoje." : `${n} pendência(s) precisam de você para sair no horário.`}
      </p>

      {/* M01: no celular a pendencia mais urgente fica na primeira dobra; os numeros vao para o fim */}
      {/* D02: progresso contra a meta da semana (barra; a semana anterior aparece como marca fina) */}
      <div className="hidden md:block">
        <MetaSemana meta={d.meta} />
      </div>

      {subiu && totalRasc > 0 && (
        <p className="mt-2 text-xs text-bad">
          Rascunhos subiram{pct !== null ? ` ${pct}%` : ""}. {somaTopo} dos {totalRasc} são de {nomesTopo} e ainda
          não têm arte ou aprovação.{" "}
          <Link href="/posts" className="text-info hover:underline">
            Ver rascunhos
          </Link>
        </p>
      )}

      {/* D01: saude por marca, um cartao por produto */}
      <section className="mt-6">
        {/* D42: quantas marcas ja rodam sozinhas */}
        <p className="mb-3 text-sm text-dim">
          Marcas prontas para publicar: <span className="font-semibold text-ink">{d.saude.filter((m) => m.conectada && m.pendencias === 0).length} de {d.saude.length}</span>.
          {d.saude.some((m) => !m.conectada) && <span> Faltam: {d.saude.filter((m) => !m.conectada).map((m) => m.nome).join(", ")} (conectar a conta).</span>}
        </p>
        <h2 className="mb-3 text-sm font-semibold text-ink">Saúde por marca</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {d.saude.map((m) => (
            <Link key={m.slug} href={`/marcas/${m.slug}`} className="relative overflow-hidden rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line2">
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: m.cor }} aria-hidden />
              <div className="text-sm font-medium text-ink">{m.nome}</div>
              <div className="mt-1 text-xs text-dim">{m.semana} posts nesta semana</div>
              <div className={`mt-1 text-xs ${m.pendencias > 0 ? "text-warn" : "text-faint"}`}>
                {m.pendencias > 0 ? `${m.pendencias} pendência(s)` : "sem pendências"}
              </div>
              <div className={`mt-1 text-[11px] ${m.conectada ? "text-ok" : "text-bad"}`}>{m.conectada ? "conta conectada" : "conta não conectada"}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* esquerda: fila de decisoes, ordenada por urgencia */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Precisa de você <span className="font-normal text-faint">· ordenado por prazo</span>
          </h2>
          {n === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
              Tudo em dia.{d.nextScheduled[0] ? ` Próxima publicação: ${d.nextScheduled[0].nome}, ${fmtDate(d.nextScheduled[0].scheduled_at)}.` : ""}
            </p>
          ) : (
            <div className="space-y-5">
              {FAIXAS.map((f) => {
                const itens = d.pendencias.filter((p) => p.tipo === f.tipo);
                if (itens.length === 0) return null;
                return (
                  <div key={f.tipo} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[11px] font-semibold uppercase tracking-wide ${TIPO_PENDENCIA[f.tipo]}`}>
                        {f.titulo} · {itens.length}
                      </span>
                      <Link href={f.href} className="text-xs text-info hover:underline">
                        {f.acao} →
                      </Link>
                    </div>
                    <ul className="space-y-2">
                      {itens.map((p) => (
                        <li
                          key={p.key}
                          className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">{p.titulo}</span>
                            <span className={`block truncate text-[11px] ${TIPO_PENDENCIA[p.tipo]}`}>{p.detalhe}</span>
                          </span>
                          <Link href={p.href} className={`${btnGhost} min-h-11 shrink-0 px-4 md:min-h-0`}>
                            {p.acao}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* M01: resumo dos numeros, no fim da rolagem do celular */}
        <section className="md:hidden">
          <p className="text-[11px] text-faint">
            {d.weekly.map((c) => `${c.label}: ${c.atual}`).join(" · ")}
          </p>
        </section>

        {/* direita: agenda do dia e estado das contas */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">{rotuloAgenda}</h2>
            {agenda.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
                Nenhuma publicação agendada.
              </p>
            ) : (
              <ul className="space-y-2">
                {agenda.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5">
                    <span className="shrink-0 text-xs font-medium text-warn">{fmtDate(p.scheduled_at)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{p.legenda?.trim() || "(sem legenda)"}</span>
                      <span className="text-[11px] text-faint">
                        @{p.slug} · {TIPO[p.tipo] ?? p.tipo}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Contas</h2>
              <Link href="/marcas" className="text-xs text-info hover:underline">
                gerenciar
              </Link>
            </div>
            <ul className="space-y-2">
              {d.connections.map((c) => (
                <li key={c.slug} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5">
                  <Avatar src={c.picture} nome={c.nome} cor={c.cor} title={c.nome} />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.nome}</span>
                  <Rede label="IG" on={c.ig} />
                  <Rede label="in" on={c.linkedin} />
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-faint">
            Piloto automático: {d.automation.sugestoes ? "sugestões 8h ligadas" : "sugestões 8h desligadas"} ·{" "}
            {d.automation.gestor ? "gestor publica 9h" : "gestor 9h desligado"}.{" "}
            <Link href="/config" className="text-info hover:underline">
              ajustar em Config
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
