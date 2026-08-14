"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setPersonaFoto } from "@/app/(app)/time/actions";
import { btnGhost } from "@/components/ui";

async function resize(file: File, max = 512): Promise<{ blob: Blob; name: string }> {
  if (!file.type.startsWith("image/")) return { blob: file, name: file.name };
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, name: file.name };
  const big = Math.max(bmp.width, bmp.height);
  const scale = Math.min(1, max / big);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return { blob: file, name: file.name };
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob: Blob | null = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.85));
  const base = file.name.replace(/\.[^.]+$/, "") || "foto";
  return blob ? { blob, name: `${base}.jpg` } : { blob: file, name: file.name };
}

export function PersonaFoto({ id, foto, nome }: { id: string; foto: string | null; nome: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(foto);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const { blob, name } = await resize(f);
      const fd = new FormData();
      fd.append("file", blob, name);
      const r = await fetch("/api/media", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falha no upload");
      setUrl(data.url);
      await setPersonaFoto(id, data.url as string);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "falha");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-full border border-line object-cover" />
      ) : (
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-panel2 text-lg font-semibold text-dim">
          {(nome[0] ?? "?").toUpperCase()}
        </span>
      )}
      <div>
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={btnGhost}>
          {busy ? "enviando…" : url ? "Trocar foto" : "Enviar foto"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
        {err && <p className="mt-1 text-xs text-bad">{err}</p>}
      </div>
    </div>
  );
}
