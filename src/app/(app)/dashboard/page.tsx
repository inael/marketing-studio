import Link from "next/link";
import { dashboardSummary, type WeeklyCard, type DashboardData } from "@/server/dashboard";
import { PageHeader, btnGhost, btnPrimary } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { PendenciasAbas } from "@/components/pendencias-abas";
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

// ícone de cada rede: câmera do Instagram e "in" do LinkedIn, em traço
function IconeRede({ label }: { label: string }) {
  if (label === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5" fill="currentColor">
        <path d="M4.5 9h3.2v10.5H4.5V9zm1.6-5a1.85 1.85 0 1 1 0 3.7 1.85 1.85 0 0 1 0-3.7zM10 9h3.1v1.4h.05c.43-.82 1.5-1.68 3.08-1.68 3.3 0 3.9 2.17 3.9 5v5.78h-3.2v-5.12c0-1.22-.02-2.8-1.7-2.8-1.71 0-1.97 1.33-1.97 2.72v5.2H10V9z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Rede({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      title={on ? `${label}: conectado` : `${label}: não conectado`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        on ? "border-ok/30 bg-ok/10 text-ok" : "border-line bg-panel2 text-faint"
      }`}
    >
      <IconeRede label={label} />
      {label}
      <span aria-hidden className="ml-0.5">{on ? "✓" : "-"}</span>
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
  const faltam = Math.max(0, meta.total - feito);
  const pct = (v: number) => Math.min(100, Math.round((v / Math.max(1, meta.total)) * 100));
  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-faint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4 text-warn">
              <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
            Meta da semana
          </div>
          <div className="mt-1 font-display text-2xl font-semibold text-ink">
            {feito} <span className="text-faint">de</span> {meta.total} posts
          </div>
        </div>
        <div className="text-xs text-dim">{meta.porMarca} por marca</div>
      </div>
      <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-panel2">
        <div className="absolute inset-y-0 left-0 bg-warn/40" style={{ width: `${pct(feito)}%` }} />
        <div className="absolute inset-y-0 left-0 bg-warn" style={{ width: `${pct(meta.publicados)}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-ink/70" style={{ left: `${pct(meta.anteriorPublicados)}%` }} title="semana anterior" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
        <div>
          <div className="font-display text-xl font-semibold text-ink">{meta.publicados}</div>
          <div className="text-[11px] text-faint">publicados</div>
        </div>
        <div>
          <div className="font-display text-xl font-semibold text-ink">{meta.agendados}</div>
          <div className="text-[11px] text-faint">agendados</div>
        </div>
        <div>
          <div className="font-display text-xl font-semibold text-warn">{faltam}</div>
          <div className="text-[11px] text-faint">a planejar</div>
        </div>
      </div>
    </section>
  );
}

// Uma faixa com muitos itens iguais (rascunhos ou contas) vira um resumo com uma ação só.
// Erros de publicação continuam um a um, porque cada um pede uma decisão diferente.
type ItemDash = { key: string; titulo: string; detalhe: string; tipo: string; acao: string; href: string };
function resumoDaFaixa(tipo: string, itens: ItemDash[], f: { acao: string; href: string }) {
  if (itens.length === 0) return [];
  if (tipo === "falha") {
    return itens.map((p) => ({ key: p.key, titulo: p.titulo, detalhe: p.detalhe, cor: TIPO_PENDENCIA[p.tipo], acao: p.acao, href: p.href }));
  }
  const n = itens.length;
  const nomes = itens.slice(0, 3).map((p) => p.titulo.replace(/^Conta do Instagram /, "").replace(/^Rascunhos · /, "")).join(", ");
  const sobra = n > 3 ? ` e mais ${n - 3}` : "";
  if (tipo === "conexao") {
    return [{ key: "conexao-resumo", titulo: `${n} contas sem Instagram conectado`, detalhe: `${nomes}${sobra}`, cor: TIPO_PENDENCIA[tipo], acao: `Conectar ${n} contas`, href: f.href }];
  }
  return [{ key: "rascunho-resumo", titulo: `${n} rascunhos sem arte ou aprovação`, detalhe: `${nomes}${sobra}`, cor: TIPO_PENDENCIA[tipo], acao: `Revisar ${n} rascunhos`, href: f.href }];
}

// separa "25 de nov., 09:00" em dia, mês e hora, para o bloco de data da agenda
function quebraData(texto: string) {
  const m = texto.match(/^(\d+) de ([^,]+), (.+)$/);
  return m ? { dia: m[1], mes: m[2].replace(".", ""), hora: m[3] } : { dia: texto, mes: "", hora: "" };
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" strokeWidth="1.8" />
                <path d="M3.5 10h17M8 3v4M16 3v4" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Ver calendário
            </Link>
            <Link href="/criar" className={btnPrimary}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Criar post
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-semibold ${n === 0 ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>{n}</span>
        <span className="text-sm text-dim">
          {n === 0 ? "Nada bloqueando as publicações de hoje." : "pendências precisam de você para sair no horário."}
        </span>
      </div>

      {/* M01: no celular a pendencia mais urgente fica na primeira dobra; os numeros vao para o fim */}
      {/* D02: progresso contra a meta da semana (barra; a semana anterior aparece como marca fina) */}
      <div className="hidden md:block">
        <MetaSemana meta={d.meta} />
      </div>

      {subiu && totalRasc > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-xs text-bad">
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
        <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight text-ink"><span aria-hidden className="h-5 w-1 rounded-full bg-warn" />Saúde por marca</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {d.saude.map((m) => (
            <Link key={m.slug} href={`/marcas/${m.slug}`} className="relative overflow-hidden rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line2">
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: m.cor }} aria-hidden />
              <div className="flex items-center gap-2.5">
                <Avatar nome={m.nome} cor={m.cor} size={28} />
                <div className="text-sm font-medium text-ink">{m.nome}</div>
              </div>
              <div className="mt-1 text-xs text-dim">{m.semana} posts nesta semana</div>
              <div className={`mt-1 text-xs ${m.pendencias > 0 ? "text-warn" : "text-faint"}`}>
                {m.pendencias > 0 ? `${m.pendencias} pendência(s)` : "sem pendências"}
              </div>
              <div className={`mt-1 text-[11px] ${m.conectada ? "text-ok" : "text-bad"}`}>{m.conectada ? "conta conectada" : "conta não conectada"}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 flex w-full flex-col gap-12">
        {/* esquerda: fila de decisoes, ordenada por urgencia */}
        <section>
          <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight text-ink"><span aria-hidden className="h-5 w-1 rounded-full bg-warn" />
            Precisa de você <span className="font-normal text-faint">· ordenado por prazo</span>
          </h2>
          {n === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
              Tudo em dia.{d.nextScheduled[0] ? ` Próxima publicação: ${d.nextScheduled[0].nome}, ${fmtDate(d.nextScheduled[0].scheduled_at)}.` : ""}
            </p>
          ) : (
            <PendenciasAbas
              faixas={FAIXAS.map((f) => ({
                key: f.tipo,
                titulo: f.titulo,
                cor: TIPO_PENDENCIA[f.tipo],
                itens: resumoDaFaixa(f.tipo, d.pendencias.filter((p) => p.tipo === f.tipo), f),
              })).filter((f) => f.itens.length > 0)}
            />
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
            <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight text-ink"><span aria-hidden className="h-5 w-1 rounded-full bg-warn" />{rotuloAgenda}</h2>
            {agenda.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
                Nenhuma publicação agendada.
              </p>
            ) : (
              <ul className="space-y-3">
                {agenda.map((p) => {
                  const data = quebraData(fmtDate(p.scheduled_at));
                  return (
                    <li key={p.id} className="flex min-w-0 overflow-hidden rounded-xl border border-line bg-panel">
                      <span aria-hidden className="w-1 shrink-0" style={{ background: p.cor }} />
                      <div className="flex w-24 shrink-0 flex-col items-center justify-center border-r border-line px-2 py-4 text-center">
                        <span className="font-display text-2xl font-semibold leading-none text-ink">{data.dia}</span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{data.mes}</span>
                        <span className="mt-2 text-xs font-semibold text-warn">{data.hora}</span>
                      </div>
                      <div className="min-w-0 flex-1 px-4 py-4">
                        <div className="line-clamp-2 text-sm font-medium leading-snug text-ink">{p.legenda?.trim() || "(sem legenda)"}</div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full border px-2 py-0.5 font-medium" style={{ borderColor: p.cor, color: p.cor }}>{p.nome}</span>
                          <span className="text-faint">{TIPO[p.tipo] ?? p.tipo}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ink"><span aria-hidden className="h-5 w-1 rounded-full bg-warn" />Contas</h2>
              <Link href="/marcas" className="text-xs text-info hover:underline">
                gerenciar
              </Link>
            </div>
            <p className="mb-4 text-xs text-dim">
              <span className="font-semibold text-ink">{d.connections.filter((c) => c.ig).length}</span> de {d.connections.length} com Instagram ·{" "}
              <span className="font-semibold text-ink">{d.connections.filter((c) => c.linkedin).length}</span> de {d.connections.length} com LinkedIn
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {d.connections.map((c) => (
                <li key={c.slug} className="min-w-0">
                  <Link
                    href={`/marcas/${c.slug}`}
                    className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-line bg-panel p-4 transition-colors hover:border-line2"
                  >
                    <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: c.cor }} />
                    <div className="flex items-center gap-3">
                      <Avatar src={c.picture} nome={c.nome} cor={c.cor} title={c.nome} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-sm font-semibold text-ink">{c.nome}</div>
                        <div className={`text-[11px] ${c.ig && c.linkedin ? "text-ok" : "text-faint"}`}>
                          {c.ig && c.linkedin ? "tudo conectado" : "falta conectar"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Rede label="Instagram" on={c.ig} />
                      <Rede label="LinkedIn" on={c.linkedin} />
                    </div>
                  </Link>
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
