"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMAGE_MODELS, VIDEO_MODELS } from "@/lib/models";
import { createStoryboardDraft } from "@/app/(app)/storyboard/actions";
import { btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };
type Scene = {
  titulo: string;
  cena: string;
  narracao: string;
  movimento: string;
  frameUrl?: string;
  videoUrl?: string;
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

  return (
    <div className="space-y-8">
      {/* Briefing */}
      <div className="space-y-5">
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
          <label className={labelCls} htmlFor="brief">Ideia / roteiro do vídeo</label>
          <textarea
            id="brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            placeholder="Ex: um reel mostrando como o produto economiza tempo no dia a dia, tom leve e direto"
            className={inputCls}
          />
        </div>

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

        {error && <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={gerarStoryboard} disabled={loading} className={btnPrimary}>
            {loading ? "montando cenas…" : "Gerar storyboard"}
          </button>
          {scenes.length > 0 && (
            <button type="button" onClick={salvarRascunho} disabled={saving} className={btnGhost}>
              {saving ? "salvando…" : "Salvar frames como rascunho"}
            </button>
          )}
        </div>
      </div>

      {/* Cenas */}
      {scenes.length > 0 && (
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
                <div className="text-sm font-medium text-ink">{sc.titulo}</div>
                <p className="text-xs text-dim">{sc.narracao}</p>
                <p className="text-[11px] text-faint">{sc.cena}</p>
                {sc.err && <p className="text-[11px] text-bad">{sc.err}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={() => gerarFrame(i)} disabled={sc.fBusy} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-50">
                    {sc.fBusy ? "…" : sc.frameUrl ? "Refazer frame" : "Gerar frame"}
                  </button>
                  <button type="button" onClick={() => gerarVideo(i)} disabled={!sc.frameUrl || sc.vBusy} className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-info disabled:opacity-40">
                    {sc.vBusy ? "gerando vídeo…" : "Gerar vídeo"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
