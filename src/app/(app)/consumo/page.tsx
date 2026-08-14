import Link from "next/link";
import { usageReport } from "@/server/usage";
import { PageHeader } from "@/components/ui";

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

export default async function ConsumoPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  const days = [7, 30, 90].includes(Number(d)) ? Number(d) : 30;
  const rep = await usageReport(days);

  return (
    <>
      <PageHeader title="Consumo" subtitle="Tokens e créditos de IA por funcionário" />

      <div className="mb-5 flex gap-2">
        {[7, 30, 90].map((x) => (
          <Link
            key={x}
            href={`/consumo?days=${x}`}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              days === x ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
            }`}
          >
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
          {/* totais */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { l: "Tokens totais", v: nf(rep.totals.tokens), t: "text-ink" },
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

          {/* por funcionário */}
          <section className="overflow-x-auto">
            <h3 className="mb-3 text-sm font-semibold text-ink">Ranking por funcionário</h3>
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-faint">
                  <th className="py-2 pr-3 font-medium">Funcionário</th>
                  <th className="py-2 px-3 font-medium">Tokens</th>
                  <th className="py-2 px-3 font-medium">Sugestões</th>
                  <th className="py-2 px-3 font-medium">Legendas</th>
                  <th className="py-2 px-3 font-medium">Gestão</th>
                  <th className="py-2 px-3 font-medium">Imagens</th>
                  <th className="py-2 px-3 font-medium">Créditos</th>
                </tr>
              </thead>
              <tbody>
                {rep.byPersona.map((p) => (
                  <tr key={p.persona} className="border-b border-line/60">
                    <td className="py-2 pr-3 text-ink">{p.persona}</td>
                    <td className="px-3 font-medium text-ink">{nf(p.tokens)}</td>
                    <td className="px-3 text-dim">{p.sugestoes}</td>
                    <td className="px-3 text-dim">{p.legendas}</td>
                    <td className="px-3 text-dim">{p.gestao}</td>
                    <td className="px-3 text-dim">{p.imagens}</td>
                    <td className="px-3 text-dim">{nf(p.credits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
