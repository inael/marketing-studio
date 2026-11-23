import Link from "next/link";
import { getMarcaAtivaSlug } from "@/server/marca-ativa";
import { listBrands } from "@/server/brands";
import { competitorReport, deriveMarket, type AccountStats } from "@/server/reports";
import { MarketPanel } from "@/components/market-panel";
import { AskData } from "@/components/ask-data";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = ["00-03", "03-06", "06-09", "09-12", "12-15", "15-18", "18-21", "21-00"];
const nf = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: n < 100 ? 1 : 0 });

function Bars({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1.5">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-faint">{v || ""}</span>
          <div className="flex h-24 w-full items-end">
            <div className="w-full rounded-t bg-info/70" style={{ height: `${(v / max) * 100}%` }} />
          </div>
          <span className="text-[9px] text-faint">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; days?: string; refresh?: string; view?: string; vs?: string }>;
}) {
  const { brand: brandParam, days: daysRaw, refresh, view, vs } = await searchParams;
  const brandSlug = brandParam ?? (await getMarcaAtivaSlug()) ?? undefined;
  const isMercado = view === "mercado";
  const days = [7, 30, 90].includes(Number(daysRaw)) ? Number(daysRaw) : 30;
  const brands = await listBrands();
  if (brands.length === 0) {
    return (
      <>
        <PageHeader title="Relatórios" subtitle="Análise de concorrentes" />
        <Empty title="Nenhuma marca ativa" hint="Ative uma marca para ver relatórios." action={<Link href="/marcas" className={btnPrimary}>Ir para Marcas</Link>} />
      </>
    );
  }
  const active = brands.find((b) => b.slug === brandSlug) ?? brands[0];
  const result = await competitorReport(active.id, days, refresh === "1");
  const err = "error" in result ? result.error : null;
  const report = "error" in result ? null : result;

  const q = (b: string, d: number, r = false) =>
    `/relatorios?brand=${b}&days=${d}${isMercado ? "&view=mercado" : ""}${r ? "&refresh=1" : ""}`;
  const tabCls = (on: boolean) =>
    `rounded-md border px-3 py-1 text-xs transition-colors ${on ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"}`;
  const rows: AccountStats[] = report ? [report.self, ...report.competitors].filter(Boolean).map((s) => s as AccountStats) : [];
  const comps = report?.competitors ?? [];
  const weekAgg = WEEK.map((_, i) => comps.reduce((s, c) => s + (c.byWeekday[i] ?? 0), 0));
  const hourAgg = HOURS.map((_, i) => comps.reduce((s, c) => s + (c.byHour[i] ?? 0), 0));
  const bestPosts = comps.flatMap((c) => c.best.map((p) => ({ ...p, who: c.username }))).sort((a, b) => b.likes + b.comments - (a.likes + a.comments)).slice(0, 6);
  const tagAgg = new Map<string, number>();
  for (const c of comps) for (const h of c.hashtags) tagAgg.set(h.tag, (tagAgg.get(h.tag) ?? 0) + h.n);
  const topTags = [...tagAgg.entries()].map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n).slice(0, 10);

  // D33: dados para a pergunta livre
  const linhasPergunta = rows.map((r) => ({
    nome: r.username || "?",
    self: Boolean(r.self),
    engajamento: r.engajamento,
    posts: r.posts,
    media: r.avgInter,
    seguidores: r.followers,
  }));

  // D31: padrao de dia/horario em frase e posts acima da media (1,5x a media de interacoes)
  const idxMax = (a: number[]) => a.indexOf(Math.max(...a));
  const temPadrao = comps.length > 0 && Math.max(...weekAgg) > 0;
  const padraoFrase = temPadrao
    ? `Padrão dos concorrentes: mais posts na ${WEEK[idxMax(weekAgg)]} e na faixa ${HOURS[idxMax(hourAgg)]}h (BRT).`
    : "";
  const mediaInteracoes = comps.length ? comps.reduce((t, c) => t + c.avgInter, 0) / comps.length : 0;
  const acimaMedia = bestPosts.filter((p) => p.likes + p.comments > mediaInteracoes * 1.5).length;

  // D30: posicao do seu perfil em cada metrica (1 = melhor)
  const selfRow = rows.find((r) => r.self);
  const metricas: { k: string; label: string; get: (s: AccountStats) => number; fmt: (v: number) => string }[] = [
    { k: "engajamento", label: "Engajamento", get: (s) => s.engajamento, fmt: (v) => `${v.toFixed(2)}%` },
    { k: "posts", label: "Posts no período", get: (s) => s.posts, fmt: (v) => nf(v) },
    { k: "media", label: "Média por post", get: (s) => s.avgInter, fmt: (v) => nf(v) },
    { k: "seguidores", label: "Seguidores", get: (s) => s.followers, fmt: (v) => nf(v) },
  ];
  const posicoes = metricas.map((m) => {
    const vals = rows.map((r) => m.get(r));
    const mine = selfRow ? m.get(selfRow) : 0;
    const max = Math.max(1, ...vals);
    const pos = [...vals].sort((a, b) => b - a).indexOf(mine) + 1;
    const medComp = comps.length ? comps.reduce((t, c) => t + m.get(c), 0) / comps.length : 0;
    const lado = mine >= medComp ? "acima" : "abaixo";
    const frase = `Você está em ${pos}º de ${rows.length} em ${m.label.toLowerCase()}, ${lado} da média dos concorrentes (${m.fmt(medComp)}).`;
    return { ...m, mine, max, pos, frase, melhor: Math.max(...vals) };
  });

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Seu perfil × concorrentes no Instagram"
        action={<Link href={q(active.slug, days, true)} className="rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:text-ink">Atualizar</Link>}
      />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <Link key={b.id} href={q(b.slug, days)} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${active.id === b.id ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: b.cor_principal }} />
              {b.nome}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={q(active.slug, d)} className={tabCls(days === d)}>
              {d} dias
            </Link>
          ))}
          <span className="mx-1 text-line2">|</span>
          <Link href={`/relatorios?brand=${active.slug}&days=${days}`} className={tabCls(!isMercado)}>
            Concorrentes
          </Link>
          <Link href={`/relatorios?brand=${active.slug}&days=${days}&view=mercado`} className={tabCls(isMercado)}>
            Mercado
          </Link>
        </div>
      </div>

      {err ? (
        <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{err}</p>
      ) : !report ? null : isMercado ? (
        <MarketPanel brandId={active.id} metrics={deriveMarket(report)} />
      ) : (
        <div className="space-y-8">
          {/* D30: comparacao de dois perfis por vez (voce x um concorrente escolhido) */}
          {selfRow && comps.length > 0 && (() => {
            const alvo = comps.find((c) => c.username === vs) ?? comps[0];
            const lado = [selfRow, alvo];
            const leitura =
              selfRow.engajamento >= alvo.engajamento && selfRow.followers < alvo.followers
                ? "Você engaja mais, mas alcança menos."
                : selfRow.engajamento < alvo.engajamento && selfRow.postsPerWeek < alvo.postsPerWeek
                  ? "O concorrente publica mais e engaja mais: vale aumentar a frequência."
                  : "Os dois estão no mesmo patamar nesta janela.";
            return (
              <section className="rounded-lg border border-line bg-panel p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-ink">Você × @{alvo.username}</h3>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {comps.map((c) => (
                      <Link key={c.username} href={`${q(active.slug, days)}&vs=${encodeURIComponent(c.username)}`} className={`rounded-md border px-2.5 py-1 ${c.username === alvo.username ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"}`}>
                        @{c.username}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {lado.map((st, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-xs text-faint">{i === 0 ? "Você" : `@${st.username}`}</div>
                      <div className="text-ink">{st.engajamento.toFixed(2)}% engajamento</div>
                      <div className="text-dim">{nf(st.postsPerWeek)} posts por semana</div>
                      <div className="text-dim">{nf(st.avgInter)} média por post</div>
                      <div className="text-dim">{nf(st.followers)} seguidores</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-dim">{leitura}</p>
              </section>
            );
          })()}

          {/* D30: posicao por metrica com barra e frase */}
          {selfRow && comps.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-ink">Sua posição por métrica</h3>
              {posicoes.map((m) => (
                <div key={m.k} className="rounded-lg border border-line bg-panel p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dim">{m.label}</span>
                    <span className="text-faint">{m.pos}º de {rows.length}</span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-panel2">
                    <div className="h-2 rounded bg-info/70" style={{ width: `${(m.mine / m.max) * 100}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-faint">
                    <span>você: {m.fmt(m.mine)}</span>
                    <span>melhor: {m.fmt(m.melhor)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-dim">{m.frase}</p>
                </div>
              ))}
            </section>
          )}
          {/* tabela comparativa (recolhida) */}
          <details className="rounded-lg border border-line bg-panel">
            <summary className="cursor-pointer px-4 py-3 text-sm text-dim hover:text-ink">Tabela completa</summary>
            <section className="overflow-x-auto p-4">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-faint">
                  <th className="py-2 pr-3 font-medium">Perfil</th>
                  <th className="py-2 px-3 font-medium">Engaj. %</th>
                  <th className="py-2 px-3 font-medium">Posts</th>
                  <th className="py-2 px-3 font-medium">Curtidas</th>
                  <th className="py-2 px-3 font-medium">Coment.</th>
                  <th className="py-2 px-3 font-medium">Média/post</th>
                  <th className="py-2 px-3 font-medium">Posts/sem</th>
                  <th className="py-2 px-3 font-medium">Seguidores</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={i} className={`border-b border-line/60 ${s.self ? "bg-panel2/40" : ""}`}>
                    <td className="py-2 pr-3">
                      <span className={s.self ? "font-semibold text-ink" : "text-dim"}>@{s.username || "?"}</span>
                      {s.self && <span className="ml-1 text-[10px] text-info">você</span>}
                      {s.error && <span className="ml-1 text-[10px] text-bad">({s.error})</span>}
                    </td>
                    <td className="px-3 text-dim">{s.engajamento.toFixed(2)}%</td>
                    <td className="px-3 text-dim">{s.posts}</td>
                    <td className="px-3 text-dim">{nf(s.likes)}</td>
                    <td className="px-3 text-dim">{nf(s.comments)}</td>
                    <td className="px-3 text-dim">{nf(s.avgInter)}</td>
                    <td className="px-3 text-dim">{nf(s.postsPerWeek)}</td>
                    <td className="px-3 text-dim">{nf(s.followers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-faint">Janela: {days} dias. Views de Reels não vêm pela API (n/d).</p>
            </section>
          </details>

          {/* D31: leitura em frase do padrao de horario */}
          {padraoFrase && <p className="text-sm text-dim">{padraoFrase}</p>}
          <AskData linhas={linhasPergunta} padrao={padraoFrase} />

          {/* dias e horários */}
          {comps.length > 0 && (
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-panel p-4">
                <h3 className="mb-3 text-sm font-medium text-ink">Dias que os concorrentes mais postam</h3>
                <Bars data={weekAgg} labels={WEEK} />
              </div>
              <div className="rounded-lg border border-line bg-panel p-4">
                <h3 className="mb-3 text-sm font-medium text-ink">Horários (BRT)</h3>
                <Bars data={hourAgg} labels={HOURS} />
              </div>
            </section>
          )}

          {/* melhores posts dos concorrentes */}
          {bestPosts.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-semibold text-ink">Melhores posts dos concorrentes</h3>
              {/* D31: criar variacao a partir dos melhores: abre o Criar com o tema pre-preenchido */}
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                {bestPosts.slice(0, 3).map((p, i) => (
                  <Link key={i} href={`/criar?assunto=${encodeURIComponent(`variação do post de @${p.who}`)}`} className="rounded-md border border-line px-3 py-1.5 text-info hover:text-ink">
                    criar variação do post de @{p.who} →
                  </Link>
                ))}
              </div>
              <p className="mb-3 text-xs text-faint">{acimaMedia} de {bestPosts.length} acima da média de interações (1,5×)</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bestPosts.map((p, i) => (
                  <a key={i} href={p.permalink ?? "#"} target="_blank" rel="noreferrer" className="flex gap-3 rounded-lg border border-line bg-panel p-3 transition-colors hover:border-line2">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-panel2">
                      {p.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.thumb} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-[9px] text-faint">{p.tipo || "post"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-info">@{p.who}</div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-dim">{p.caption || "(sem legenda)"}</p>
                      <div className="mt-1 text-[11px] text-faint">♥ {nf(p.likes)} · 💬 {nf(p.comments)}</div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* hashtags */}
          {topTags.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink">Hashtags mais usadas pelos concorrentes</h3>
              <div className="flex flex-wrap gap-2">
                {topTags.map((t) => (
                  <span key={t.tag} className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-dim">
                    #{t.tag} <span className="text-faint">×{t.n}</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          <p className="text-[11px] text-faint">Gerado {new Date(report.generatedAt).toLocaleString("pt-BR")} · cache de 6h (use Atualizar pra forçar).</p>
        </div>
      )}
    </>
  );
}
