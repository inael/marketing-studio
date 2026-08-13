"use client";

import { useState } from "react";
import Link from "next/link";
import { createDraftFromSuggestion } from "@/app/(app)/sugestoes/actions";
import { TIPO } from "@/lib/ui";
import { btnPrimary, inputCls, labelCls } from "@/components/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };
type Suggestion = {
  titulo: string;
  angulo: string;
  legenda: string;
  formato: string;
  analista?: string;
  saved?: boolean;
  saving?: boolean;
};
type Grupo = "noticias" | "concorrentes";
type Meta = { rss: number; competitors: number; warnings?: string[] };

export function Suggestions({ brands }: { brands: BrandLite[] }) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [noticias, setNoticias] = useState<Suggestion[]>([]);
  const [concorrentes, setConcorrentes] = useState<Suggestion[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const brand = brands.find((b) => b.id === brandId);
  const setter = (g: Grupo) => (g === "noticias" ? setNoticias : setConcorrentes);
  const patch = (g: Grupo, i: number, p: Partial<Suggestion>) =>
    setter(g)((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function gerar() {
    if (!brand) return setError("Selecione uma marca.");
    setError(null);
    setLoading(true);
    setNoticias([]);
    setConcorrentes([]);
    setMeta(null);
    try {
      const r = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      setNoticias((data.noticias ?? []) as Suggestion[]);
      setConcorrentes((data.concorrentes ?? []) as Suggestion[]);
      setMeta(data.meta as Meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falhou");
    } finally {
      setLoading(false);
    }
  }

  async function criarRascunho(g: Grupo, i: number) {
    if (!brand) return;
    const list = g === "noticias" ? noticias : concorrentes;
    const sc = list[i];
    patch(g, i, { saving: true });
    const res = await createDraftFromSuggestion({ brand_id: brand.id, legenda: sc.legenda, tipo: sc.formato });
    if (res.ok) patch(g, i, { saving: false, saved: true });
    else {
      patch(g, i, { saving: false });
      setError(res.error);
    }
  }

  const card = (g: Grupo) => (s: Suggestion, i: number) => (
    <div key={i} className="flex flex-col rounded-lg border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-ink">{s.titulo}</div>
        <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">
          {TIPO[s.formato] ?? s.formato}
        </span>
      </div>
      {s.analista && <div className="mt-0.5 text-[11px] text-info">por {s.analista}</div>}
      {s.angulo && <p className="mt-1.5 text-xs text-dim">{s.angulo}</p>}
      <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{s.legenda}</p>
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
            onClick={() => criarRascunho(g, i)}
            disabled={s.saving}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-50"
          >
            {s.saving ? "criando…" : "Criar rascunho"}
          </button>
        )}
      </div>
    </div>
  );

  const hasResults = noticias.length > 0 || concorrentes.length > 0;

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
        <button type="button" onClick={gerar} disabled={loading} className={btnPrimary}>
          {loading ? "o time está analisando…" : "Gerar sugestões"}
        </button>
      </div>

      {error && <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>}

      {meta && (
        <p className="text-xs text-faint">
          Baseado em {meta.rss} notícia(s) e {meta.competitors} post(s) de concorrentes.
          {meta.warnings?.length ? ` (${meta.warnings.join("; ")})` : ""}
        </p>
      )}

      {hasResults && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Ideias das notícias <span className="text-faint">({noticias.length})</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-3">{noticias.map(card("noticias"))}</div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Ideias dos concorrentes <span className="text-faint">({concorrentes.length})</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-3">{concorrentes.map(card("concorrentes"))}</div>
          </section>
        </div>
      )}
    </div>
  );
}
