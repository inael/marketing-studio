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

export function MarketPanel({ brandId, metrics }: { brandId: string; metrics: MarketMetric[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-faint">
        &ldquo;Mercado&rdquo; = média dos concorrentes cadastrados desta marca. O selo mostra você vs essa média.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.key} brandId={brandId} m={m} />
        ))}
      </div>
    </div>
  );
}
