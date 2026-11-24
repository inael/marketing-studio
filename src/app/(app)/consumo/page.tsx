import Link from "next/link";
import { usageReport } from "@/server/usage";
import { listAllBrands } from "@/server/brands";
import { getMarcaAtivaSlug } from "@/server/marca-ativa";
import { PageHeader } from "@/components/ui";
import { listPosts } from "@/server/posts";
import { getSettings } from "@/server/settings";
import { salvarTeto } from "./actions";

export const dynamic = "force-dynamic";

const nf = (n: number) => Number(n ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const TIPO_LABEL: Record<string, string> = {
  sugestao: "Sugestões",
  legenda: "Legendas",
  gestao: "Gestão",
  insight: "Insights",
  imagem: "Imagens",
  descricao: "Descrições",
};

export default async function ConsumoPage({ searchParams }: { searchParams: Promise<{ days?: string; brand?: string }> }) {
  const { days: d, brand: brandParam } = await searchParams;
  const brands = await listAllBrands();
  const brandSlug = brandParam ?? (await getMarcaAtivaSlug()) ?? undefined;
  const marca = brands.find((b) => b.slug === brandSlug);
  const days = [7, 30, 90].includes(Number(d)) ? Number(d) : 30;
  const rep = await usageReport(days, marca?.id ?? null);
  // M22: teto mensal configuravel (padrao US$ 60) e ritmo do gasto ate o fim do mes
  const tetoRaw = Number((await getSettings())["consumo.teto"]);
  const teto = tetoRaw > 0 ? tetoRaw : 60;
  const ritmoMes = days > 0 ? (rep.totals.cost / days) * 30 : 0;
  const pct = Math.min(100, (rep.totals.cost / teto) * 100);
  const frase = ritmoMes > teto
    ? `No ritmo atual, fecha em US$ ${ritmoMes.toFixed(0)}, acima do teto.`
    : `No ritmo atual, fecha em US$ ${ritmoMes.toFixed(0)}, dentro do teto.`;
  // D34: posts publicados no periodo (da marca, se houver filtro) para o custo por post
  const corte = Date.now() - days * 86400000;
  const publicados = (await listPosts()).filter(
    (p) => p.status === "published" && new Date(p.updated_at).getTime() >= corte && (!marca || p.brand_id === marca.id),
  ).length;

  return (
    <>
      <PageHeader title="Consumo" subtitle="Tokens e créditos de IA por funcionário" />

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-line bg-panel p-1.5">
        {[7, 30, 90].map((x) => (
          <Link
            key={x}
            href={`/consumo?days=${x}`}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors ${
              days === x ? "bg-panel2 text-ink shadow-sm" : "text-dim hover:text-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
            {x} dias
          </Link>
        ))}
      </div>

      {rep.totals.eventos === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-10 text-center text-sm text-faint">
          Sem consumo registrado nesse período. Gere sugestões/legendas que os tokens começam a aparecer aqui.
        </p>
      ) : (
        <div className="space-y-8">
          <form action={salvarTeto} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-panel p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-panel2 text-warn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.5c-.4-.9-1.3-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.5M12 6.5v1.5M12 16v1.5" /></svg></span>
            <label htmlFor="teto" className="flex min-w-0 flex-col gap-1.5 text-xs text-dim">
              Teto mensal (US$)
              <input id="teto" name="teto" type="number" min="1" step="1" defaultValue={teto} className="min-h-11 w-32 rounded-lg border border-line bg-panel2 px-3 text-sm text-ink" />
            </label>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm text-dim hover:text-ink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></svg>
              Salvar teto
            </button>
          </form>

          {/* D35: alertas em tres faixas (70%, 90%, 100% do teto), cada um com a acao que resolve */}
          {pct >= 70 && (
            <div className={`rounded-md border px-4 py-3 text-sm ${pct >= 100 ? "border-bad/40 bg-bad/5 text-bad" : pct >= 90 ? "border-warn/40 bg-warn/5 text-warn" : "border-line bg-panel text-dim"}`}>
              {pct >= 100 ? (
                <>Teto de US$ {teto} atingido: a geração de imagem está pausada. <a href="#teto" className="underline">Aumentar o teto</a> ou aguardar o mês seguinte.</>
              ) : pct >= 90 ? (
                <>{pct.toFixed(0)}% do teto: a geração de imagem pede confirmação. <a href="#teto" className="underline">Ver teto</a></>
              ) : (
                <>{pct.toFixed(0)}% do teto mensal (US$ {teto}). <a href="#teto" className="underline">Ajustar teto</a></>
              )}
            </div>
          )}

          {/* M22: numero grande do periodo, barra do teto e a frase do ritmo */}
          <section className="rounded-lg border border-line bg-panel p-5">
            <div className="text-4xl font-semibold text-ink">US$ {rep.totals.cost.toFixed(2).replace(".", ",")}</div>
            <div className="mt-1 text-xs text-dim">Consumo nos últimos {days} dias · {pct.toFixed(0)}% do teto de US$ {teto}</div>
            <div className="mt-3 h-2 rounded bg-panel2"><div className="h-2 rounded bg-info/70" style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-xs text-dim">{frase}</p>
          </section>

          {/* totais */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { l: "Tokens totais", v: nf(rep.totals.tokens), t: "text-ink" },
              { l: "Custo (US$)", v: `$${rep.totals.cost.toFixed(4)}`, t: "text-ok" },
              { l: "Prompt", v: nf(rep.totals.prompt), t: "text-dim" },
              { l: "Resposta", v: nf(rep.totals.completion), t: "text-dim" },
              { l: "Imagens", v: nf(rep.totals.imagens), t: "text-info" },
              { l: "Créditos (img)", v: nf(rep.totals.credits), t: "text-warn" },
            ].map((c) => (
              <div key={c.l} className="rounded-lg border border-line bg-panel p-4">
                <div className={`text-xl font-semibold ${c.t}`}>{c.v}</div>
                <div className="mt-0.5 text-xs text-dim">{c.l}</div>
              </div>
            ))}
          </div>

          {/* D34: custo por tarefa e por post publicado */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-panel p-4">
              <div className="text-xs text-dim">Custo por post publicado</div>
              <div className="mt-1 text-xl font-semibold text-ink">{publicados > 0 ? `$${(rep.totals.cost / publicados).toFixed(4)}` : "-"}</div>
              <div className="mt-0.5 text-[11px] text-faint">{publicados} posts publicados no período</div>
            </div>
            <div className="rounded-lg border border-line bg-panel p-4">
              <div className="text-xs text-dim">Custo por tarefa</div>
              <ul className="mt-2 space-y-1 text-xs">
                {rep.byTipo.map((t) => (
                  <li key={t.tipo} className="flex justify-between gap-3">
                    <span className="text-dim">{TIPO_LABEL[t.tipo] ?? t.tipo}</span>
                    <span className="text-ink">${(t.n ? t.cost / t.n : 0).toFixed(4)} <span className="text-faint">· {t.n}x</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* D34: consumo por funcao do trabalho (conteudo, design, gestao, analise), sem ranking de pessoas */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Consumo por função</h3>
            {(() => {
              const funcaoDe = (tipo: string) =>
                tipo === "imagem" ? "Design" : tipo === "gestao" ? "Gestão" : tipo === "insight" ? "Análise" : "Conteúdo";
              const grupos = new Map<string, { cost: number; n: number }>();
              for (const t of rep.byTipo) {
                const f = funcaoDe(t.tipo);
                const g = grupos.get(f) ?? { cost: 0, n: 0 };
                g.cost += t.cost;
                g.n += t.n;
                grupos.set(f, g);
              }
              const total = Math.max(1e-9, rep.totals.cost);
              return (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {["Conteúdo", "Design", "Gestão", "Análise"].map((f) => {
                    const g = grupos.get(f) ?? { cost: 0, n: 0 };
                    return (
                      <li key={f} className="rounded-lg border border-line bg-panel p-4">
                        <div className="text-sm font-medium text-ink">{f}</div>
                        <div className="mt-1 text-lg font-semibold text-ink">US$ {g.cost.toFixed(4)}</div>
                        <div className="text-xs text-dim">{((g.cost / total) * 100).toFixed(0)}% do consumo · {g.n} tarefa(s)</div>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </section>

          {/* por tipo */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">Por tipo de operação</h3>
            <div className="flex flex-wrap gap-2">
              {rep.byTipo.map((t) => (
                <span key={t.tipo} className="rounded-lg border border-line bg-panel px-3 py-2 text-xs text-dim">
                  <span className="text-ink">{TIPO_LABEL[t.tipo] ?? t.tipo}</span> · {nf(t.tokens)} tokens · {t.n}x
                  {t.credits > 0 ? ` · ${nf(t.credits)} créd.` : ""}
                </span>
              ))}
            </div>
          </section>

          <p className="text-[11px] text-faint">
            Tokens vêm do gateway (UseTokia/LiteLLM). Imagens geradas via sessão entram como créditos
            (FLUX.2 Pro 1K ≈ 1/imagem). &ldquo;(manual)&rdquo; = legendas/insights gerados por você, sem persona.
          </p>
        </div>
      )}
    </>
  );
}
