"use client";

import { useState } from "react";
import type { MarketMetric } from "@/server/reports";

const fmt = (m: MarketMetric, v: number) =>
  m.unit === "%" ? `${v.toFixed(2)}%` : v.toLocaleString("pt-BR", { maximumFractionDigits: v < 100 ? 1 : 0 });

function Card({ brandId, m }: { brandId: string; m: MarketMetric }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const favorable = m.higherBetter ? m.delta >= 0 : m.delta <= 0;
  const arrow = m.delta >= 0 ? "▲" : "▼";

  async function quero() {
    setBusy(true);
    try {
      const r = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, metrica: m.label, self: m.self, market: m.market }),
      });
      const data = await r.json();
      setInsight(r.ok ? data.insight : data.error ?? "falhou");
    } catch (e) {
      setInsight(e instanceof Error ? e.message : "falhou");
    } finally {
      setBusy(false);
    }
  }

  // D32: regua mostra voce contra a media do mercado; a frase sai pronta a partir do delta
  const teto = Math.max(m.self, m.market, 1) * 1.25;
  const posSelf = (m.self / teto) * 100;
  const posMkt = (m.market / teto) * 100;
  const frase = `Você está ${Math.abs(m.delta).toFixed(0)}% ${m.delta >= 0 ? "acima" : "abaixo"} da média do mercado${favorable ? ", boa posição." : ", vale atacar essa métrica."}`;

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="text-xs text-dim">{m.label}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold text-ink">{fmt(m, m.self)}</span>
        <span className={`text-xs font-medium ${favorable ? "text-ok" : "text-bad"}`}>
          {arrow} {Math.abs(m.delta).toFixed(0)}%
        </span>
      </div>
      <div className="mt-0.5 text-[11px] text-faint">média do mercado: {fmt(m, m.market)}</div>
      <div className="relative mt-3 h-2 rounded bg-panel2" aria-hidden>
        <span className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-faint" style={{ left: `${posMkt}%` }} title="média do mercado" />
        <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-info" style={{ left: `${posSelf}%` }} title="você" />
      </div>
      <p className="mt-2 text-xs text-dim">{frase}</p>
      <a href="/sugestoes" className="mt-2 inline-block text-xs text-info hover:underline">Ver sugestão →</a>
      {insight ? (
        <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-xs text-dim">{insight}</p>
      ) : (
        <button
          type="button"
          onClick={quero}
          disabled={busy}
          className="mt-3 rounded-md border border-line px-2.5 py-1 text-[11px] text-info transition-colors hover:bg-panel2 disabled:opacity-50"
        >
          {busy ? "pensando…" : "✦ Quero um insight"}
        </button>
      )}
    </div>
  );
}

// D32: a metrica com a maior distancia desfavoravel ganha o espaco principal; as outras ficam em fila
export function MarketPanel({ brandId, metrics }: { brandId: string; metrics: MarketMetric[] }) {
  const desfavoravel = (m: MarketMetric) => (m.higherBetter ? m.delta < 0 : m.delta > 0);
  const ordem = [...metrics].sort((a, b) => Number(desfavoravel(b)) * Math.abs(b.delta) - Number(desfavoravel(a)) * Math.abs(a.delta));
  const [prio, ...fila] = ordem;
  if (!prio) return null;
  const teto = Math.max(prio.self, prio.market, 1) * 1.2;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="rounded-xl border border-line bg-panel p-5">
        <div className="text-[11px] uppercase tracking-wide text-faint">Prioridade</div>
        <div className="mt-1 text-lg font-semibold text-ink">{prio.label}</div>
        <div className="mt-4 space-y-3 text-xs">
          <div>
            <div className="mb-1 flex justify-between text-dim"><span>Você</span><span>{fmt(prio, prio.self)}</span></div>
            <div className="h-3 rounded bg-panel2"><div className="h-3 rounded bg-info/70" style={{ width: `${(prio.self / teto) * 100}%` }} /></div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-dim"><span>Mercado</span><span>{fmt(prio, prio.market)}</span></div>
            <div className="h-3 rounded bg-panel2"><div className="h-3 rounded bg-faint" style={{ width: `${(prio.market / teto) * 100}%` }} /></div>
          </div>
        </div>
        <p className="mt-4 text-xs text-dim">Diferença de {Math.abs(prio.delta).toFixed(0)}% {desfavoravel(prio) ? "contra você" : "a seu favor"}.</p>
      </section>
      <ul className="space-y-2">
        {fila.map((m) => (
          <li key={m.key} className="flex items-center justify-between rounded-md border border-line bg-panel px-3 py-2 text-xs">
            <span className="text-dim">{m.label}</span>
            <span className={desfavoravel(m) ? "text-bad" : "text-ok"}>{m.delta >= 0 ? "▲" : "▼"} {Math.abs(m.delta).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
