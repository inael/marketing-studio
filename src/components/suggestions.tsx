"use client";

import { useState } from "react";
import Link from "next/link";
import { createDraftFromSuggestion } from "@/app/(app)/sugestoes/actions";
import { TIPO } from "@/lib/ui";
import { btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };
type Suggestion = {
  titulo: string;
  angulo: string;
  legenda: string;
  formato: string;
  fonte: string;
  saved?: boolean;
  saving?: boolean;
};
type Meta = { rss: number; competitors: number; warnings?: string[] };

export function Suggestions({ brands }: { brands: BrandLite[] }) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [n, setN] = useState(5);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const brand = brands.find((b) => b.id === brandId);
  const patch = (i: number, p: Partial<Suggestion>) =>
    setItems((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function gerar() {
    if (!brand) return setError("Selecione uma marca.");
    setError(null);
    setLoading(true);
    setItems([]);
    setMeta(null);
    try {
      const r = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id, n }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      setItems(data.suggestions as Suggestion[]);
      setMeta(data.meta as Meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falhou");
    } finally {
      setLoading(false);
    }
  }

  async function criarRascunho(i: number) {
    if (!brand) return;
    const sc = items[i];
    patch(i, { saving: true });
    const res = await createDraftFromSuggestion({
      brand_id: brand.id,
      legenda: sc.legenda,
      tipo: sc.formato,
    });
    if (res.ok) patch(i, { saving: false, saved: true });
    else {
      patch(i, { saving: false });
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className={labelCls}>Marca</label>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrandId(b.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  brandId === b.id ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.cor_principal }} />
                {b.nome}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="n">Quantas</label>
          <input id="n" type="number" min={1} max={8} value={n} onChange={(e) => setN(Number(e.target.value))} className={`${inputCls} max-w-20`} />
        </div>
        <button type="button" onClick={gerar} disabled={loading} className={btnPrimary}>
          {loading ? "analisando fontes…" : "Gerar sugestões"}
        </button>
      </div>

      {error && <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>}

      {meta && (
        <p className="text-xs text-faint">
          Baseado em {meta.rss} notícia(s) e {meta.competitors} post(s) de concorrentes.
          {meta.warnings?.length ? ` (${meta.warnings.join("; ")})` : ""}
        </p>
      )}

      {items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((s, i) => (
            <div key={i} className="flex flex-col rounded-lg border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium text-ink">{s.titulo}</div>
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">
                  {TIPO[s.formato] ?? s.formato}
                </span>
              </div>
              {s.angulo && <p className="mt-1 text-xs text-dim">{s.angulo}</p>}
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{s.legenda}</p>
              {s.fonte && <p className="mt-2 text-[11px] text-faint">fonte: {s.fonte}</p>}
              <div className="mt-auto flex items-center gap-2 pt-3">
                {s.saved ? (
                  <>
                    <span className="text-xs text-ok">rascunho criado</span>
                    <Link href="/posts" className="text-xs text-info hover:underline">
                      ver em Posts
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => criarRascunho(i)}
                    disabled={s.saving}
                    className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {s.saving ? "criando…" : "Criar rascunho"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
