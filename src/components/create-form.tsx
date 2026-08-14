"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPostAction, type CreateInput } from "@/app/(app)/criar/actions";
import { InstagramPreview } from "@/components/instagram-preview";
import { btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";
import { IMAGE_MODELS } from "@/lib/models";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };

const TIPOS: { v: CreateInput["tipo"]; label: string }[] = [
  { v: "image", label: "Imagem" },
  { v: "carousel", label: "Carrossel" },
  { v: "reel", label: "Reel" },
];
const FORMATOS: { v: string; label: string }[] = [
  { v: "sem_personagem", label: "Sem personagem" },
  { v: "com_personagem", label: "Com personagem" },
  { v: "demo_ui", label: "Demo de UI" },
];

function parseTags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

export function CreateForm({ brands }: { brands: BrandLite[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [tipo, setTipo] = useState<CreateInput["tipo"]>("image");
  const [formato, setFormato] = useState("sem_personagem");
  const [legenda, setLegenda] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<null | CreateInput["mode"]>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [imgPrompt, setImgPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const brand = brands.find((b) => b.id === brandId) ?? brands[0];
  const tags = parseTags(tagsRaw);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("brand_id", brand?.id ?? "");
        const r = await fetch("/api/media", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "falha no upload");
        setMedia((m) => [...m, data.url as string]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "falha no upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(mode: CreateInput["mode"]) {
    setError(null);
    if (!brand) return setError("Selecione uma marca.");
    if (media.length === 0) return setError("Adicione ao menos uma imagem.");
    if (mode === "agendar" && !scheduledAt) return setError("Escolha data e hora do agendamento.");

    setBusy(mode);
    const res = await createPostAction({
      brand_id: brand.id,
      tipo,
      formato,
      legenda,
      hashtags: tags,
      media,
      mode,
      scheduled_at: mode === "agendar" ? new Date(scheduledAt).toISOString() : null,
    });
    if (res.ok) {
      router.push("/posts");
    } else {
      setError(res.error);
      setBusy(null);
    }
  }

  async function genCaption() {
    if (!brand) return setError("Selecione uma marca.");
    setError(null);
    setAiBusy(true);
    try {
      const r = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id, atual: legenda, tipo }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falha na IA");
      setLegenda(String(data.caption ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "falha na IA");
    } finally {
      setAiBusy(false);
    }
  }

  async function genImage() {
    if (!brand) return setError("Selecione uma marca.");
    const p = imgPrompt.trim();
    if (!p) return setError("Descreva a imagem no campo antes de gerar.");
    setError(null);
    setImgBusy(true);
    try {
      const r = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, brand_id: brand.id, aspect_ratio: "1:1", model: imageModel }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falha ao gerar imagem");
      setMedia((m) => [...m, data.url as string]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falha ao gerar imagem");
    } finally {
      setImgBusy(false);
    }
  }

  const seg = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      active ? "bg-panel2 text-ink" : "text-dim hover:text-ink"
    }`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Editor */}
      <div className="space-y-6">
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Tipo</label>
            <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
              {TIPOS.map((t) => (
                <button key={t.v} type="button" onClick={() => setTipo(t.v)} className={seg(tipo === t.v)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Formato</label>
            <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
              {FORMATOS.map((f) => (
                <button key={f.v} type="button" onClick={() => setFormato(f.v)} className={seg(formato === f.v)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Mídia {tipo === "carousel" && <span className="text-faint">(2+ imagens)</span>}</label>
          <div className="flex flex-wrap gap-3">
            {media.map((url, i) => (
              <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMedia((m) => m.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remover"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="grid h-20 w-20 place-items-center rounded-md border border-dashed border-line text-xs text-faint transition-colors hover:border-line2 hover:text-dim disabled:opacity-50"
            >
              {uploading ? "enviando…" : "+ imagem"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="mt-3 rounded-md border border-line bg-panel/50 p-3">
            <div className="mb-1.5 text-xs font-medium text-dim">Ou gerar a imagem com IA</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="Descreva a imagem (ex: mesa de escritório minimalista, luz natural, sem texto)"
                className={`${inputCls} min-w-56 flex-1`}
              />
              <button type="button" onClick={genImage} disabled={imgBusy} className={btnGhost}>
                {imgBusy ? "gerando…" : "Gerar"}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-faint">
              <span>Modelo:</span>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="rounded border border-line bg-panel2 px-2 py-1 text-[11px] text-dim"
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-dim" htmlFor="legenda">
              Legenda
            </label>
            <button
              type="button"
              onClick={genCaption}
              disabled={aiBusy || !brand}
              className="text-xs text-info transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {aiBusy ? "gerando…" : "✦ Gerar com IA"}
            </button>
          </div>
          <textarea
            id="legenda"
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            rows={5}
            placeholder="Escreva a legenda ou gere com IA…"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="tags">Hashtags</label>
          <input
            id="tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="marketing automacao itbooster"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="quando">Agendar para <span className="text-faint">(opcional)</span></label>
          <input
            id="quando"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={`${inputCls} max-w-xs`}
          />
        </div>

        {error && (
          <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          <button type="button" onClick={() => submit("rascunho")} disabled={!!busy} className={btnGhost}>
            {busy === "rascunho" ? "salvando…" : "Salvar rascunho"}
          </button>
          <button type="button" onClick={() => submit("agendar")} disabled={!!busy} className={btnGhost}>
            {busy === "agendar" ? "agendando…" : "Agendar"}
          </button>
          <button type="button" onClick={() => submit("auto")} disabled={!!busy} className={btnGhost}>
            {busy === "auto" ? "agendando…" : "Auto-agendar"}
          </button>
          <button type="button" onClick={() => submit("publicar")} disabled={!!busy} className={btnPrimary}>
            {busy === "publicar" ? "publicando…" : "Publicar agora"}
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-faint">
          <span className="text-dim">Rascunho</span>: guarda sem publicar (aprovar depois em Posts).{" "}
          <span className="text-dim">Agendar</span>: usa a data acima.{" "}
          <span className="text-dim">Auto-agendar</span>: encaixa no próximo horário fixo da marca.{" "}
          <span className="text-dim">Publicar agora</span>: envia pro Instagram na hora.
        </p>
      </div>

      {/* Preview ao vivo */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Preview</p>
        <InstagramPreview
          username={brand?.slug ?? "marca"}
          cor={brand?.cor_principal ?? "#000"}
          media={media}
          legenda={legenda}
          hashtags={tags}
        />
      </div>
    </div>
  );
}
