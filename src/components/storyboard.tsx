"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMAGE_MODELS, VIDEO_MODELS } from "@/lib/models";
import {
  createStoryboardDraft,
  createStoryboardReel,
  createStoryboardStory,
} from "@/app/(app)/storyboard/actions";
import { btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };
type Scene = {
  titulo: string;
  cena: string;
  narracao: string;
  movimento: string;
  frameUrl?: string;
  videoUrl?: string;
  aceita?: boolean; // D27: cena aceita pelo revisor
  fBusy?: boolean;
  vBusy?: boolean;
  err?: string;
};

export function Storyboard({ brands }: { brands: BrandLite[] }) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [n, setN] = useState(4);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brand = brands.find((b) => b.id === brandId);
  const patch = (i: number, p: Partial<Scene>) =>
    setScenes((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function gerarStoryboard() {
    if (!brand) return setError("Selecione uma marca.");
    if (!brief.trim()) return setError("Escreva a ideia do vídeo.");
    setError(null);
    setLoading(true);
    setScenes([]);
    try {
      const r = await fetch("/api/ai/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id, brief, n }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      setScenes(data.scenes as Scene[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falhou");
    } finally {
      setLoading(false);
    }
  }

  async function gerarFrame(i: number) {
    const sc = scenes[i];
    if (!brand) return;
    patch(i, { fBusy: true, err: undefined });
    try {
      const r = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: sc.cena, brand_id: brand.id, aspect_ratio: "9:16", model: imageModel }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      patch(i, { frameUrl: data.url, fBusy: false });
    } catch (e) {
      patch(i, { fBusy: false, err: e instanceof Error ? e.message : "falhou" });
    }
  }

  async function gerarVideo(i: number) {
    const sc = scenes[i];
    if (!brand || !sc.frameUrl) return;
    patch(i, { vBusy: true, err: undefined });
    try {
      const r = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: sc.frameUrl,
          prompt: sc.movimento,
          brand_id: brand.id,
          model: videoModel,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      patch(i, { videoUrl: data.url, vBusy: false });
    } catch (e) {
      patch(i, { vBusy: false, err: e instanceof Error ? e.message : "falhou" });
    }
  }

  async function salvarRascunho() {
    if (!brand) return;
    const media = scenes.map((s) => s.frameUrl).filter(Boolean) as string[];
    if (!media.length) return setError("Gere ao menos um frame antes de salvar.");
    setSaving(true);
    const res = await createStoryboardDraft({ brand_id: brand.id, media, legenda: brief });
    if (res.ok) router.push("/posts");
    else {
      setError(res.error);
      setSaving(false);
    }
  }

  async function saveReel(i: number) {
    const sc = scenes[i];
    if (!brand || !sc.videoUrl) return;
    const res = await createStoryboardReel({ brand_id: brand.id, video: sc.videoUrl, legenda: brief });
    if (res.ok) router.push("/posts");
    else setError(res.error);
  }

  async function saveStory(i: number) {
    const sc = scenes[i];
    const url = sc.videoUrl || sc.frameUrl;
    if (!brand || !url) return;
    const res = await createStoryboardStory({ brand_id: brand.id, url, legenda: brief });
    if (res.ok) router.push("/posts");
    else setError(res.error);
  }

  // D27: reordena uma cena e marca/desmarca como aceita
  const mover = (i: number, dir: -1 | 1) =>
    setScenes((lista) => {
      const j = i + dir;
      if (j < 0 || j >= lista.length) return lista;
      const copia = [...lista];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });
  // D27: faixa de cenas: selecionar, arrastar para reordenar e painel da cena escolhida
  const [sel, setSel] = useState(0);
  const [arrasto, setArrasto] = useState<number | null>(null);
  const moverPara = (de: number, para: number) => {
    if (de === para || para < 0 || para >= scenes.length) return;
    setScenes((l) => {
      const c = [...l];
      const [x] = c.splice(de, 1);
      c.splice(para, 0, x);
      return c;
    });
    setSel(para);
  };
  const aceitar = (i: number) => setScenes((lista) => lista.map((x, j) => (j === i ? { ...x, aceita: !x.aceita } : x)));

  // D26: tempo estimado de cada cena (pela fala) e ato do roteiro (gancho, desenvolvimento, chamada)
  const tempos = scenes.map((sc) => Math.max(3, Math.round(sc.narracao.trim().split(/s+/).filter(Boolean).length / 2.5)));
  const acumulado = tempos.reduce<number[]>((acc, t) => [...acc, (acc[acc.length - 1] ?? 0) + t], []);
  const duracaoTotal = acumulado[acumulado.length - 1] ?? 0;
  const atoDe = (i: number) => (i === 0 ? "Gancho" : i === scenes.length - 1 && scenes.length > 1 ? "Chamada" : "Desenvolvimento");

  return (
    <div className="space-y-8">
      {/* Briefing */}
      <div className="space-y-6 rounded-xl border border-line bg-panel p-5">
        <div>
          <header className="mb-3 flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warn text-xs font-bold text-canvas">1</span>
            <h2 className="text-sm font-semibold text-ink">Marca</h2>
          </header>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {brands.map((b) => {
              const on = brandId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setBrandId(b.id)}
                  className={`relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    on ? "border-warn bg-panel2 text-ink" : "border-line bg-panel2/40 text-dim hover:border-line2 hover:text-ink"
                  }`}
                >
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: b.cor_principal }} />
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-canvas" style={{ background: b.cor_principal }}>{b.nome.charAt(0)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{b.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <header className="mb-3 flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warn text-xs font-bold text-canvas">2</span>
            <h2 className="text-sm font-semibold text-ink">Ideia e roteiro</h2>
          </header>
          <label className="sr-only" htmlFor="brief">Ideia / roteiro do vídeo</label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="Ex: um reel mostrando como o produto economiza tempo no dia a dia, tom leve e direto"
            className={inputCls}
          />
        </div>

        <div>
          <header className="mb-3 flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warn text-xs font-bold text-canvas">3</span>
            <h2 className="text-sm font-semibold text-ink">Cenas e modelos</h2>
          </header>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="n">Cenas</label>
            <input id="n" type="number" min={2} max={8} value={n} onChange={(e) => setN(Number(e.target.value))} className={`${inputCls} max-w-24`} />
          </div>
          <div>
            <label className={labelCls} htmlFor="imodel">Modelo de imagem</label>
            <select id="imodel" value={imageModel} onChange={(e) => setImageModel(e.target.value)} className={inputCls}>
              {IMAGE_MODELS.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="vmodel">Modelo de vídeo</label>
            <select id="vmodel" value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className={inputCls}>
              {VIDEO_MODELS.map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
            </select>
          </div>
        </div>

        </div>

        {error && <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          <button type="button" onClick={gerarStoryboard} disabled={loading} className={`${btnPrimary} gap-2`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
            {loading ? "montando cenas…" : "Gerar storyboard"}
          </button>
          {scenes.length > 0 && (
            <button type="button" onClick={salvarRascunho} disabled={saving} className={`${btnGhost} gap-2`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></svg>
              {saving ? "salvando…" : "Salvar frames como rascunho"}
            </button>
          )}
        </div>
      </div>

      {/* Cenas */}
      {scenes.length > 0 && (
        <>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {scenes.map((sc, i) => (
            <button
              key={i}
              type="button"
              draggable
              onDragStart={() => setArrasto(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (arrasto !== null) moverPara(arrasto, i);
                setArrasto(null);
              }}
              onClick={() => setSel(i)}
              className={`min-w-32 shrink-0 cursor-grab rounded-md border p-2 text-left text-xs ${sel === i ? "border-line2 bg-panel2" : "border-line"}`}
            >
              <div className="flex justify-between">
                <span className="text-dim">{i + 1}</span>
                <span className={sc.aceita ? "text-ok" : "text-faint"}>{sc.aceita ? "aceita" : "nova"}</span>
              </div>
              <div className="mt-1 truncate text-faint">{sc.narracao || "sem narração"}</div>
            </button>
          ))}
        </div>
        {scenes[sel] && (
          <div className="rounded-md border border-line p-3 text-xs">
            <div className="mb-2 flex justify-between gap-3 text-faint">
              <span className="truncate">{scenes[sel - 1] ? `← ${scenes[sel - 1].narracao.slice(0, 30)}` : ""}</span>
              <span>Cena {sel + 1} de {scenes.length}</span>
              <span className="truncate">{scenes[sel + 1] ? `${scenes[sel + 1].narracao.slice(0, 30)} →` : ""}</span>
            </div>
            <p className="text-sm text-ink">{scenes[sel].narracao}</p>
          </div>
        )}
        <p className="text-xs text-faint">Roteiro em três atos · duração estimada {duracaoTotal}s</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((sc, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-line bg-panel">
              <div className="relative aspect-[9/16] bg-panel2">
                {sc.videoUrl ? (
                  <video src={sc.videoUrl} controls playsInline className="h-full w-full object-cover" />
                ) : sc.frameUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sc.frameUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center px-3 text-center text-xs text-faint">
                    {sc.fBusy ? "gerando frame…" : "frame ainda não gerado"}
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[11px] text-white">
                  {i + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-faint">
                  <span>{atoDe(i)} · {acumulado[i] - tempos[i]}s a {acumulado[i]}s</span>
                  <span className={sc.aceita ? "text-ok" : "text-faint"}>{sc.aceita ? "aceita" : "nova"}</span>
                </div>
                <div className="text-sm font-medium text-ink">{sc.titulo}</div>
                <p className="text-xs text-dim"><span className="text-faint">Fala:</span> {sc.narracao}</p>
                <p className="text-[11px] text-faint"><span className="text-faint">Tela:</span> {sc.cena}</p>
                {sc.err && <p className="text-[11px] text-bad">{sc.err}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="min-h-11 min-w-11 rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-40 md:min-h-0 md:min-w-0" aria-label="Mover para cima">↑</button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === scenes.length - 1} className="min-h-11 min-w-11 rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-40 md:min-h-0 md:min-w-0" aria-label="Mover para baixo">↓</button>
                  <button type="button" onClick={() => aceitar(i)} className={`min-h-11 rounded-md border px-2.5 py-1 text-xs md:min-h-0 transition-colors ${sc.aceita ? "border-ok/40 text-ok" : "border-line text-dim hover:text-ink"}`}>
                    {sc.aceita ? "Aceita" : "Aceitar"}
                  </button>
                  <button type="button" onClick={() => gerarFrame(i)} disabled={sc.fBusy} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-50">
                    {sc.fBusy ? "…" : sc.frameUrl ? "Refazer frame" : "Gerar frame"}
                  </button>
                  <button type="button" onClick={() => gerarVideo(i)} disabled={!sc.frameUrl || sc.vBusy} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-info disabled:opacity-40">
                    {sc.vBusy ? "gerando vídeo…" : "Gerar vídeo"}
                  </button>
                  {sc.videoUrl && (
                    <button type="button" onClick={() => saveReel(i)} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ok">
                      + reel
                    </button>
                  )}
                  {(sc.videoUrl || sc.frameUrl) && (
                    <button type="button" onClick={() => saveStory(i)} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ok">
                      + story
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
