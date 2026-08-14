"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  acceptSuggestion,
  dismissSuggestion,
  dismissSuggestions,
  clearBrandSuggestions,
} from "@/app/(app)/sugestoes/actions";
import { TIPO } from "@/lib/ui";
import { btnPrimary, btnGhost } from "@/components/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };
type Suggestion = {
  id: string;
  brand_id: string;
  grupo: "noticia" | "concorrente";
  titulo: string | null;
  angulo: string | null;
  legenda: string;
  formato: string | null;
  analista: string | null;
  ref_url: string | null;
  ref_label: string | null;
  imagem_prompt: string | null;
  status: string;
  created_at: string;
};
type Meta = { rss: number; competitors: number; warnings?: string[] };
type Escolha = { titulo: string; por_que: string };
type Verdict = { gestor: string; escolhas: Escolha[]; ajustes: string; feedback_time: string };

const PHRASES = [
  "lendo as notícias",
  "analisando os concorrentes",
  "pensando no ângulo",
  "escrevendo a legenda",
  "revisando o tom de voz",
  "imaginando a imagem",
];

export function Suggestions({
  brands,
  initial,
  analystNames,
}: {
  brands: BrandLite[];
  initial: Suggestion[];
  analystNames: string[];
}) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [items, setItems] = useState<Suggestion[]>(initial);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [gestorBusy, setGestorBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const brand = brands.find((b) => b.id === brandId);
  const brandItems = items.filter((s) => s.brand_id === brandId);
  const noticias = brandItems.filter((s) => s.grupo === "noticia");
  const concorrentes = brandItems.filter((s) => s.grupo === "concorrente");

  // status ao vivo: "fulano está ..." passando enquanto gera
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, [loading]);

  const names = analystNames.length ? analystNames : ["O time"];
  const liveStatus = `${names[tick % names.length]} está ${PHRASES[tick % PHRASES.length]}…`;

  async function gerar(feedback?: string) {
    if (!brand) return setError("Selecione uma marca.");
    setError(null);
    setLoading(true);
    setVerdict(null);
    try {
      const r = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id, feedback }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      const novas: Suggestion[] = [...(data.noticias ?? []), ...(data.concorrentes ?? [])];
      setItems((prev) => [...novas, ...prev]);
      setMeta(data.meta as Meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falhou");
    } finally {
      setLoading(false);
    }
  }

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusy((s) => new Set(s).add(id));
    try {
      await fn();
    } finally {
      setBusy((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  async function aceitar(id: string) {
    await withBusy(id, async () => {
      const res = await acceptSuggestion(id);
      if (res.ok) setItems((prev) => prev.filter((s) => s.id !== id));
      else setError(res.error);
    });
  }

  async function apagar(id: string) {
    await withBusy(id, async () => {
      await dismissSuggestion(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
    });
  }

  async function apagarSelecionadas() {
    const ids = [...selected];
    if (!ids.length) return;
    await dismissSuggestions(ids);
    setItems((prev) => prev.filter((s) => !selected.has(s.id)));
    setSelected(new Set());
  }

  async function limparMarca() {
    if (!brand) return;
    await clearBrandSuggestions(brand.id);
    setItems((prev) => prev.filter((s) => s.brand_id !== brand.id));
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function selecionarTodas() {
    setSelected(new Set(brandItems.map((s) => s.id)));
  }

  async function ativarGestor() {
    if (!brand) return;
    setError(null);
    setGestorBusy(true);
    try {
      const r = await fetch("/api/ai/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id, noticias, concorrentes }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      setVerdict(data as Verdict);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falhou");
    } finally {
      setGestorBusy(false);
    }
  }

  const card = (s: Suggestion) => (
    <div key={s.id} className="flex flex-col rounded-lg border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={selected.has(s.id)}
            onChange={() => toggle(s.id)}
            className="mt-1 accent-ink"
          />
          <span className="text-sm font-medium text-ink">{s.titulo || "Ideia"}</span>
        </label>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">
            {TIPO[s.formato ?? "image"] ?? s.formato}
          </span>
          <button
            type="button"
            onClick={() => apagar(s.id)}
            disabled={busy.has(s.id)}
            title="Apagar sugestão"
            className="grid h-6 w-6 place-items-center rounded-full text-faint transition-colors hover:bg-panel2 hover:text-bad disabled:opacity-40"
          >
            ×
          </button>
        </div>
      </div>

      {s.analista && <div className="mt-0.5 pl-6 text-[11px] text-info">por {s.analista}</div>}
      {s.angulo && <p className="mt-1.5 text-xs text-dim">{s.angulo}</p>}
      <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{s.legenda}</p>

      {s.ref_url && (
        <a
          href={s.ref_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-info hover:underline"
        >
          {s.grupo === "noticia" ? "ver notícia original" : `ver post de ${s.ref_label ?? "concorrente"}`} ↗
        </a>
      )}
      {s.grupo === "noticia" && s.ref_label && (
        <p className="mt-1 line-clamp-2 text-[11px] text-faint">{s.ref_label}</p>
      )}

      {s.imagem_prompt && (
        <details className="mt-3 rounded-md border border-line bg-panel2/40 p-2">
          <summary className="cursor-pointer text-[11px] text-dim">prompt da imagem (IA)</summary>
          <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-faint">{s.imagem_prompt}</p>
        </details>
      )}

      <div className="mt-auto flex items-center gap-2 pt-3">
        <button
          type="button"
          onClick={() => aceitar(s.id)}
          disabled={busy.has(s.id)}
          className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:border-ok/50 hover:text-ok disabled:opacity-50"
        >
          {busy.has(s.id) ? "criando…" : "Aceitar e criar rascunho"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* controles */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1.5 text-xs font-medium text-dim">Marca</div>
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
        <button type="button" onClick={() => gerar()} disabled={loading} className={btnPrimary}>
          {loading ? "o time está analisando…" : "Gerar sugestões"}
        </button>
      </div>

      {loading && (
        <p className="animate-pulse rounded-md border border-info/30 bg-info/5 px-3 py-2 text-sm text-info">
          {liveStatus}
        </p>
      )}
      {error && <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>}
      {meta && !loading && (
        <p className="text-xs text-faint">
          Última geração: {meta.rss} notícia(s) e {meta.competitors} post(s) de concorrentes.
          {meta.warnings?.length ? ` (${meta.warnings.join("; ")})` : ""}
        </p>
      )}

      {/* GESTOR no topo */}
      <section className="rounded-lg border border-line bg-panel/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Gestor</h2>
            <p className="mt-0.5 text-xs text-dim">
              Revisa as ideias do time desta marca, escolhe as melhores e dá feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={ativarGestor}
            disabled={gestorBusy || brandItems.length === 0}
            className={btnGhost}
          >
            {gestorBusy ? "gestor analisando…" : "Ativar gestor"}
          </button>
        </div>
        {verdict && (
          <div className="mt-4 space-y-4 text-sm">
            <div className="text-xs text-info">Análise de {verdict.gestor}</div>
            {verdict.escolhas?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-faint">Escolhas do gestor</div>
                <ul className="mt-1 space-y-1">
                  {verdict.escolhas.map((e, i) => (
                    <li key={i} className="text-ink">
                      <span className="font-medium">{e.titulo}</span>
                      {e.por_que && <span className="text-dim"> — {e.por_que}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {verdict.ajustes && (
              <div>
                <div className="text-xs font-medium text-faint">Ajustes sugeridos</div>
                <p className="mt-1 whitespace-pre-wrap text-dim">{verdict.ajustes}</p>
              </div>
            )}
            {verdict.feedback_time && (
              <div>
                <div className="text-xs font-medium text-faint">Feedback pro time</div>
                <p className="mt-1 whitespace-pre-wrap text-dim">{verdict.feedback_time}</p>
                <button
                  type="button"
                  onClick={() => gerar(verdict.feedback_time)}
                  disabled={loading}
                  className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:text-ink disabled:opacity-50"
                >
                  {loading ? "time refazendo…" : "Refazer com o feedback do gestor"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* barra de gestão */}
      {brandItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-faint">{brandItems.length} sugestão(ões) salvas</span>
          <span className="text-line2">·</span>
          <button type="button" onClick={selecionarTodas} className="text-dim hover:text-ink">
            selecionar todas
          </button>
          {selected.size > 0 && (
            <button type="button" onClick={apagarSelecionadas} className="text-dim hover:text-bad">
              apagar selecionadas ({selected.size})
            </button>
          )}
          <span className="text-line2">·</span>
          <button type="button" onClick={limparMarca} className="text-dim hover:text-bad">
            limpar tudo desta marca
          </button>
        </div>
      )}

      {brandItems.length === 0 && !loading ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-8 text-center text-sm text-faint">
          Nenhuma sugestão salva pra {brand?.nome}. Clique em <span className="text-dim">Gerar sugestões</span>.
        </p>
      ) : (
        <div className="space-y-8">
          {noticias.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Ideias das notícias <span className="text-faint">({noticias.length})</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-3">{noticias.map(card)}</div>
            </section>
          )}
          {concorrentes.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Ideias dos concorrentes <span className="text-faint">({concorrentes.length})</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-3">{concorrentes.map(card)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
