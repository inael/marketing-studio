"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  acceptSuggestion,
  dismissSuggestion,
  dismissSuggestions,
  clearBrandSuggestions,
  updateSuggestionAction,
} from "@/app/(app)/sugestoes/actions";
import { TIPO, readableOn } from "@/lib/ui";
import { btnPrimary, btnGhost, inputCls } from "@/components/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string; avatar?: string | null };
type Grupo = "noticia" | "concorrente";
type Suggestion = {
  id: string;
  brand_id: string;
  grupo: Grupo;
  titulo: string | null;
  angulo: string | null;
  legenda: string;
  formato: string | null;
  analista: string | null;
  ref_url: string | null;
  ref_label: string | null;
  imagem_prompt: string | null;
  hashtags: string[];
  status: string;
  created_at: string;
};
type Tab = "noticia" | "concorrente" | "twitter" | "youtube";
type Meta = { rss: number; competitors: number; warnings?: string[] };
type Verdict = { gestor: string; escolhas: { titulo: string; por_que: string }[]; ajustes: string; feedback_time: string };

const TABS: { v: Tab; label: string; ready: boolean }[] = [
  { v: "noticia", label: "Notícias", ready: true },
  { v: "concorrente", label: "Concorrentes", ready: true },
  { v: "twitter", label: "Twitter/X", ready: false },
  { v: "youtube", label: "YouTube", ready: false },
];
const PHRASES = ["lendo as notícias", "olhando os concorrentes", "pensando no ângulo", "escrevendo a legenda", "imaginando a imagem"];

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
  const [tab, setTab] = useState<Tab>("noticia");
  const [items, setItems] = useState<Suggestion[]>(initial);
  const [loading, setLoading] = useState<Tab | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [gestorBusy, setGestorBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ id: string; field: "legenda" | "hashtags" | "prompt" } | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const brand = brands.find((b) => b.id === brandId);
  const brandItems = items.filter((s) => s.brand_id === brandId);
  const tabItems = tab === "noticia" || tab === "concorrente" ? brandItems.filter((s) => s.grupo === tab) : [];

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setTick((t) => t + 1), 1400);
    return () => clearInterval(id);
  }, [loading]);
  const names = analystNames.length ? analystNames : ["O time"];
  const liveStatus = `${names[tick % names.length]} está ${PHRASES[tick % PHRASES.length]}…`;

  async function gerar(fonte: Tab, feedback?: string) {
    if (!brand) return setError("Selecione uma marca.");
    if (fonte !== "noticia" && fonte !== "concorrente") return;
    setError(null);
    setLoading(fonte);
    setVerdict(null);
    try {
      const r = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id, fonte, feedback }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      const novas: Suggestion[] = [...(data.noticias ?? []), ...(data.concorrentes ?? [])];
      setItems((prev) => [...novas, ...prev]);
      setMeta(data.meta as Meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falhou");
    } finally {
      setLoading(null);
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
  const aceitar = (id: string) =>
    withBusy(id, async () => {
      const res = await acceptSuggestion(id);
      if (res.ok) setItems((prev) => prev.filter((s) => s.id !== id));
      else setError(res.error);
    });
  const apagar = (id: string) =>
    withBusy(id, async () => {
      await dismissSuggestion(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
    });
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
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function startEdit(s: Suggestion, field: "legenda" | "hashtags" | "prompt") {
    setEditing({ id: s.id, field });
    setDraft(field === "hashtags" ? (s.hashtags ?? []).join(" ") : field === "prompt" ? s.imagem_prompt ?? "" : s.legenda);
  }
  async function saveEdit() {
    if (!editing) return;
    const { id, field } = editing;
    const patch =
      field === "hashtags"
        ? { hashtags: draft.split(/[\s,]+/).map((h) => h.replace(/^#/, "").trim()).filter(Boolean) }
        : field === "prompt"
          ? { imagem_prompt: draft }
          : { legenda: draft };
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setEditing(null);
    await updateSuggestionAction(id, patch);
  }
  const isEditing = (id: string, f: string) => editing?.id === id && editing.field === f;

  async function ativarGestor() {
    if (!brand) return;
    setError(null);
    setGestorBusy(true);
    try {
      const noticias = brandItems.filter((s) => s.grupo === "noticia");
      const concorrentes = brandItems.filter((s) => s.grupo === "concorrente");
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
    <div key={s.id} className="grid gap-4 rounded-lg border border-line bg-panel p-4 md:grid-cols-2">
      {/* coluna esquerda: a postagem (editável) */}
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1 accent-ink" />
            <span className="text-sm font-medium text-ink">{s.titulo || "Ideia"}</span>
          </label>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-faint">{TIPO[s.formato ?? "image"] ?? s.formato}</span>
            <button type="button" onClick={() => apagar(s.id)} disabled={busy.has(s.id)} title="Apagar" className="grid h-6 w-6 place-items-center rounded-full text-faint hover:bg-panel2 hover:text-bad disabled:opacity-40">
              ×
            </button>
          </div>
        </div>
        {s.analista && <div className="mt-0.5 pl-6 text-[11px] text-info">por {s.analista}</div>}
        {s.angulo && <p className="mt-1.5 text-xs text-dim">{s.angulo}</p>}

        {/* legenda editável */}
        {isEditing(s.id, "legenda") ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            rows={4}
            className={`${inputCls} mt-3 text-sm`}
          />
        ) : (
          <p onDoubleClick={() => startEdit(s, "legenda")} title="dois cliques pra editar" className="mt-3 cursor-text whitespace-pre-wrap text-sm text-ink">
            {s.legenda}
          </p>
        )}

        {/* hashtags editáveis */}
        {isEditing(s.id, "hashtags") ? (
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={saveEdit} className={`${inputCls} mt-2 text-xs`} />
        ) : (
          <div onDoubleClick={() => startEdit(s, "hashtags")} title="dois cliques pra editar" className="mt-2 flex cursor-text flex-wrap gap-1">
            {(s.hashtags ?? []).length ? (
              s.hashtags.map((h) => (
                <span key={h} className="rounded-full bg-panel2 px-2 py-0.5 text-[11px] text-info">#{h}</span>
              ))
            ) : (
              <span className="text-[11px] text-faint">sem hashtags (2 cliques pra adicionar)</span>
            )}
          </div>
        )}

        {s.ref_url && (
          <a href={s.ref_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-info hover:underline">
            {s.grupo === "noticia" ? "ver notícia original" : `ver post de ${s.ref_label ?? "concorrente"}`} ↗
          </a>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3">
          <button type="button" onClick={() => aceitar(s.id)} disabled={busy.has(s.id)} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim hover:border-ok/50 hover:text-ok disabled:opacity-50">
            {busy.has(s.id) ? "criando…" : "Aceitar e criar rascunho"}
          </button>
        </div>
      </div>

      {/* coluna direita: preview (imagem = prompt) */}
      <div className="overflow-hidden rounded-lg border border-line bg-panel2/40">
        <div className="flex items-center gap-2 px-3 py-2">
          {brand?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.avatar} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold" style={{ background: brand?.cor_principal, color: readableOn(brand?.cor_principal ?? "#000") }}>
              {(brand?.slug[0] ?? "?").toUpperCase()}
            </span>
          )}
          <span className="text-xs font-semibold text-ink">{brand?.slug}</span>
        </div>
        {/* área da imagem = prompt (editável) */}
        <div className="border-y border-line bg-panel px-3 py-3">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-faint">prompt da imagem (2 cliques pra editar)</div>
          {isEditing(s.id, "prompt") ? (
            <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={saveEdit} rows={4} className={`${inputCls} text-xs`} />
          ) : (
            <p onDoubleClick={() => startEdit(s, "prompt")} className="cursor-text whitespace-pre-wrap text-xs text-dim">
              {s.imagem_prompt || "sem prompt (2 cliques pra escrever)"}
            </p>
          )}
        </div>
        <div className="px-3 py-2 text-xs leading-snug text-ink">
          <span className="font-semibold">{brand?.slug} </span>
          {s.legenda}
          {(s.hashtags ?? []).length > 0 && <span className="text-info"> {s.hashtags.map((h) => `#${h}`).join(" ")}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* marca */}
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

      {/* abas por fonte */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        {TABS.map((t) => {
          const n = t.v === "noticia" || t.v === "concorrente" ? brandItems.filter((s) => s.grupo === t.v).length : 0;
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.v ? "bg-panel2 text-ink" : "text-dim hover:text-ink"
              }`}
            >
              {t.label}
              {t.ready && n > 0 && <span className="ml-1 text-faint">({n})</span>}
              {!t.ready && <span className="ml-1 text-[10px] text-faint">em breve</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>}

      {tab === "twitter" || tab === "youtube" ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-8 text-center text-sm text-faint">
          Sugestões a partir do {tab === "twitter" ? "Twitter/X" : "YouTube"} precisam de uma chave de API
          configurada. Assim que cadastrarmos, esta aba gera igual às outras.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => gerar(tab)} disabled={loading === tab} className={btnPrimary}>
              {loading === tab ? "o time está analisando…" : `Gerar sugestões de ${tab === "noticia" ? "notícias" : "concorrentes"}`}
            </button>
            {loading === tab && (
              <span className="animate-pulse text-sm text-info">{liveStatus}</span>
            )}
            {meta && loading !== tab && (
              <span className="text-xs text-faint">
                Última: {meta.rss} notícia(s), {meta.competitors} post(s).
                {meta.warnings?.length ? ` (${meta.warnings.join("; ")})` : ""}
              </span>
            )}
          </div>

          {/* gestor no topo */}
          <section className="rounded-lg border border-line bg-panel/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Gestor</h2>
                <p className="mt-0.5 text-xs text-dim">Revisa as ideias desta marca, escolhe as melhores e dá feedback.</p>
              </div>
              <button type="button" onClick={ativarGestor} disabled={gestorBusy || brandItems.length === 0} className={btnGhost}>
                {gestorBusy ? "gestor analisando…" : "Ativar gestor"}
              </button>
            </div>
            {verdict && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="text-xs text-info">Análise de {verdict.gestor}</div>
                {verdict.escolhas?.length > 0 && (
                  <ul className="space-y-1">
                    {verdict.escolhas.map((e, i) => (
                      <li key={i} className="text-ink">
                        <span className="font-medium">{e.titulo}</span>
                        {e.por_que && <span className="text-dim"> — {e.por_que}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {verdict.ajustes && <p className="whitespace-pre-wrap text-dim">{verdict.ajustes}</p>}
                {verdict.feedback_time && (
                  <div>
                    <p className="whitespace-pre-wrap text-dim">{verdict.feedback_time}</p>
                    <button type="button" onClick={() => gerar(tab, verdict.feedback_time)} disabled={loading === tab} className="mt-2 rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:text-ink disabled:opacity-50">
                      {loading === tab ? "refazendo…" : "Refazer esta aba com o feedback"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* gestão da seleção */}
          {tabItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-faint">{tabItems.length} nesta aba</span>
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

          {tabItems.length === 0 && loading !== tab ? (
            <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-8 text-center text-sm text-faint">
              Nenhuma sugestão de {tab === "noticia" ? "notícias" : "concorrentes"} pra {brand?.nome}. Clique em Gerar.
            </p>
          ) : (
            <div className="space-y-3">{tabItems.map(card)}</div>
          )}
        </>
      )}
    </div>
  );
}
