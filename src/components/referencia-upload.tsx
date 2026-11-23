"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/components/ui";

// reduz a imagem no navegador antes de enviar (mesmo padrao da foto de persona)
async function reduzir(file: File, max = 1600): Promise<{ blob: Blob; name: string }> {
  if (!file.type.startsWith("image/")) return { blob: file, name: file.name };
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { blob: file, name: file.name };
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return { blob: file, name: file.name };
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob: Blob | null = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.9));
  const base = file.name.replace(/\.[^.]+$/, "") || "referencia";
  return blob ? { blob, name: `${base}.jpg` } : { blob: file, name: file.name };
}

/** envia uma ou mais imagens para o servidor e registra cada URL com a acao recebida */
export function ReferenciaUpload({
  rotulo,
  multiplo = false,
  aoEnviar,
  brandId,
}: {
  rotulo: string;
  multiplo?: boolean;
  aoEnviar: (url: string) => Promise<void>;
  brandId: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      for (const f of Array.from(files)) {
        const { blob, name } = await reduzir(f);
        const fd = new FormData();
        fd.append("file", blob, name);
        fd.append("brand_id", brandId);
        const r = await fetch("/api/media", { method: "POST", body: fd });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "falha no envio");
        await aoEnviar(data.url as string);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "falha no envio");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <label className={`${btnGhost} cursor-pointer ${busy ? "opacity-60" : ""}`}>
        {busy ? "Enviando..." : rotulo}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple={multiplo}
          disabled={busy}
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      {err && <p role="alert" className="text-xs text-bad">{err}</p>}
    </div>
  );
}
