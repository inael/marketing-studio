"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPostAction, type CreateInput } from "@/app/(app)/criar/actions";
import { InstagramPreview } from "@/components/instagram-preview";
import { btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";
import { IMAGE_MODELS } from "@/lib/models";
import { sessaoExpirou } from "@/lib/sessao";

type BrandLite = {
  id: string;
  slug: string;
  nome: string;
  cor_principal: string;
  avatar?: string | null;
  ig?: boolean;
  ultimo?: string | null;
};

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
// D14: "Marca" usa o tom da marca; os demais sobrescrevem para este post
const TONS: { v: string; label: string }[] = [
  { v: "", label: "Marca" },
  { v: "direto", label: "Direto" },
  { v: "didatico", label: "Didático" },
  { v: "casual", label: "Casual" },
  { v: "persuasivo", label: "Persuasivo" },
  { v: "alegre", label: "Alegre" },
  { v: "amigavel", label: "Amigável" },
];
const TAMANHOS: { v: string; label: string }[] = [
  { v: "curta", label: "Curta" },
  { v: "media", label: "Média" },
  { v: "longa", label: "Longa" },
];
const TEMPLATES = [
  "Um post sobre",
  "Escreva razões para",
  "O que fazer para",
  "Aponte os benefícios de",
  "Explique como",
];

type Variante = { texto: string; tom: string; tamanho: string };

// M45: a miniatura de video usa <video>; reconhece pela extensao da URL
function ehVideo(url: string): boolean {
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

// Reduz a imagem no cliente (máx 1600px + JPEG) pra não estourar o limite de
// upload da Vercel (~4.5MB) — corrige o erro 413 com fotos grandes.
async function compressImage(file: File): Promise<{ blob: Blob; name: string }> {
  if (!file.type.startsWith("image/")) return { blob: file, name: file.name };
  const MAX = 1600;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { blob: file, name: file.name };
  const big = Math.max(bitmap.width, bitmap.height);
  if (big <= MAX && file.size < 3_500_000) {
    bitmap.close?.();
    return { blob: file, name: file.name };
  }
  const scale = Math.min(1, MAX / big);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, name: file.name };
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
  return blob ? { blob, name: `${base}.jpg` } : { blob: file, name: file.name };
}

type AgendaItem = { brand_id: string; nome: string; scheduled_at: string };
type Janela = { brand_id: string; weekday: number; hour: number; minute: number };

type BibItem = { id: string; url: string; brand_id: string | null; tipo: string | null };
type MidiaAba = "enviar" | "biblioteca" | "gerar";
// D13: a biblioteca abre primeiro; enviar do computador e a opcao secundaria
const MIDIA_ABAS: { v: MidiaAba; label: string }[] = [
  { v: "biblioteca", label: "Biblioteca" },
  { v: "enviar", label: "Enviar do computador" },
  { v: "gerar", label: "Gerar com IA" },
];

export function CreateForm({
  brands,
  agenda = [],
  janelas = [],
  biblioteca = [],
  hashtagsSugeridas = {},
  assuntoInicial,
}: {
  brands: BrandLite[];
  agenda?: AgendaItem[];
  janelas?: Janela[];
  biblioteca?: BibItem[];
  hashtagsSugeridas?: Record<string, string[]>;
  assuntoInicial?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [tipo, setTipo] = useState<CreateInput["tipo"]>("image");
  const [formato, setFormato] = useState("sem_personagem");
  const [legenda, setLegenda] = useState("");
  // M40: a legenda que esta sendo escrita fica guardada no aparelho, para nao se perder sem conexao
  useEffect(() => {
    try {
      const salvo = localStorage.getItem("ms_rascunho_legenda");
      if (salvo) setLegenda(salvo);
    } catch {
      // localStorage bloqueado: segue sem rascunho
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("ms_rascunho_legenda", legenda);
    } catch {
      // sem persistencia
    }
  }, [legenda]);
  const [tagsRaw, setTagsRaw] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  // D13: proporcao medida de cada imagem (url -> w/h)
  const [proporcoes, setProporcoes] = useState<Record<string, number>>({});
  const [scheduledAt, setScheduledAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [upProg, setUpProg] = useState<{ nome: string; pct: number; feitos: number; total: number; texto?: string } | null>(null);
  const [retomada, setRetomada] = useState<{ file: File; key: string; uploadId: string; feitas: Map<number, string> } | null>(null);
  const [pendentes, setPendentes] = useState<{ blob: Blob; name: string }[]>([]);
  const [busy, setBusy] = useState<null | CreateInput["mode"]>(null);
  // B04: uma chave por abertura do formulario; clique duplo ou reenvio nao cria outro post
  const idemRef = useRef<string>("");
  if (!idemRef.current) idemRef.current = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const [varBusy, setVarBusy] = useState<number[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [imgBusy, setImgBusy] = useState(false);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [imgPrompt, setImgPrompt] = useState("");
  const [midiaAba, setMidiaAba] = useState<MidiaAba>("biblioteca");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [tom, setTom] = useState("");
  const [tamanho, setTamanho] = useState("media");
  const [template, setTemplate] = useState("");
  // D31: o tema vem de "criar variacao" nos melhores posts
  const [assunto, setAssunto] = useState(assuntoInicial ?? "");
  const [segmento, setSegmento] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const brand = brands.find((b) => b.id === brandId) ?? brands[0];

  // D13: reordena os slides (arrastar ou setas)
  const moverMidia = (de: number, para: number) => {
    if (de === para || para < 0 || para >= media.length) return;
    setMedia((m) => {
      const c = [...m];
      const [x] = c.splice(de, 1);
      c.splice(para, 0, x);
      return c;
    });
  };
  // D13: biblioteca da marca (inclui o que nao e de marca nenhuma)
  const bibDaMarca = biblioteca.filter((m) => m.tipo !== "video" && (!m.brand_id || m.brand_id === brandId));

  // D13: mede a proporcao de cada imagem no navegador
  useEffect(() => {
    media.forEach((url) => {
      if (proporcoes[url] !== undefined) return;
      const img = new window.Image();
      img.onload = () => setProporcoes((p) => ({ ...p, [url]: img.naturalWidth / img.naturalHeight }));
      img.src = url;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // D13: rotulo e aviso de proporcao para cada slide
  const rotuloProp = (r: number | undefined) => {
    if (r === undefined) return { t: "…", ok: true };
    if (Math.abs(r - 0.8) < 0.02) return { t: "4:5", ok: true };
    if (Math.abs(r - 1) < 0.02) return { t: "1:1", ok: tipo !== "reel" };
    if (Math.abs(r - 9 / 16) < 0.02) return { t: "9:16", ok: tipo === "reel" };
    return { t: "fora do padrão", ok: false };
  };
  const tags = parseTags(tagsRaw);

  // M08: recorta a imagem no centro para a proporcao do formato e reenvia pelo mesmo caminho
  async function recortarPara(url: string) {
    const alvo = tipo === "reel" ? 9 / 16 : 4 / 5;
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      let sw = w;
      let sh = h;
      let sx = 0;
      let sy = 0;
      if (w / h > alvo) {
        sw = Math.round(h * alvo);
        sx = Math.round((w - sw) / 2);
      } else {
        sh = Math.round(w / alvo);
        sy = Math.round((h - sh) / 2);
      }
      const c = document.createElement("canvas");
      c.width = sw;
      c.height = sh;
      c.getContext("2d")?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob: Blob | null = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("não consegui recortar");
      const dt = new DataTransfer();
      dt.items.add(new File([blob], "recorte.jpg", { type: "image/jpeg" }));
      setMedia((m) => m.filter((u) => u !== url));
      await onFiles(dt.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "falha ao recortar");
    }
  }

  // M45: video em partes de 8 MB direto para o R2. Cada parte confirmada fica guardada;
  // se a conexao cai, o envio continua pela ultima parte que chegou.
  const PARTE = 8 * 1024 * 1024;
  async function apiMidia(corpo: Record<string, unknown>) {
    const r = await fetch("/api/media/multipart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    if (sessaoExpirou(r)) throw new Error("sessão expirada");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "falha no envio");
    return d;
  }

  async function enviarVideo(file: File, anterior?: { key: string; uploadId: string; feitas: Map<number, string> }) {
    setUploading(true);
    setError(null);
    const total = Math.ceil(file.size / PARTE);
    const sess = anterior ?? (await apiMidia({ acao: "iniciar", nome: file.name, tipo: file.type, tamanho: file.size }));
    const feitas = anterior?.feitas ?? new Map<number, string>();
    if (anterior) {
      // confirma no servidor quais partes realmente chegaram
      const st = await apiMidia({ acao: "status", key: sess.key, uploadId: sess.uploadId });
      feitas.clear();
      for (const p of st.partes as { numero: number; etag: string }[]) feitas.set(p.numero, p.etag);
    }
    const mb = (n: number) => (n / 1048576).toFixed(0);
    try {
      for (let n = 1; n <= total; n++) {
        if (feitas.has(n)) continue;
        const ini = (n - 1) * PARTE;
        const pedaco = file.slice(ini, Math.min(file.size, ini + PARTE));
        let tent = 0;
        for (;;) {
          try {
            setUpProg({ nome: file.name, pct: Math.round(((n - 1) / total) * 100), feitos: n - 1, total, texto: `${mb(ini)} de ${mb(file.size)} MB` });
            const { url } = await apiMidia({ acao: "parte", key: sess.key, uploadId: sess.uploadId, numero: n });
            const r = await fetch(url, { method: "PUT", body: pedaco });
            if (!r.ok) throw new Error("parte recusada pelo armazenamento");
            const etag = r.headers.get("ETag");
            if (!etag) throw new Error("o armazenamento não devolveu a confirmação da parte");
            feitas.set(n, etag);
            break;
          } catch (e) {
            tent++;
            if (tent >= 3) throw e;
            await new Promise((res) => setTimeout(res, 1000 * tent));
          }
        }
      }
      const r = await apiMidia({
        acao: "concluir",
        key: sess.key,
        uploadId: sess.uploadId,
        partes: [...feitas.entries()].map(([numero, etag]) => ({ numero, etag })),
        tipo: file.type,
        brand_id: brand?.id ?? "",
      });
      setMedia((m) => [...m, r.url as string]);
      setRetomada(null);
      setUpProg(null);
    } catch (e) {
      setUpProg(null);
      setRetomada({ file, key: sess.key, uploadId: sess.uploadId, feitas });
      setError(`${e instanceof Error ? e.message : "falha no envio"}. Conexão caiu: já chegaram ${mb([...feitas.keys()].length * PARTE)} MB. Continue quando a conexão voltar.`);
    } finally {
      setUploading(false);
    }
  }

  // M45: envio com progresso real; se a conexao cai, retoma do arquivo onde parou
  // B05: a imagem vai direto ao armazenamento com URL assinada; o servidor confere ao final
  async function enviarArquivo(blob: Blob, name: string, onPct: (p: number) => void): Promise<string> {
    const mime = blob.type || "image/jpeg";
    // B06: dimensoes lidas do arquivo antes do envio
    let dim: { largura?: number; altura?: number } = {};
    try {
      const bmp = await createImageBitmap(blob);
      dim = { largura: bmp.width, altura: bmp.height };
      bmp.close?.();
    } catch {
      dim = {};
    }
    const pedido = await fetch("/api/media/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: name, mime, tamanho: blob.size, brandId: brand?.id ?? "" }),
    });
    if (sessaoExpirou(pedido)) throw new Error("sessão expirada");
    const dados = await pedido.json();
    if (!pedido.ok) throw new Error(dados.error ?? "falha no envio");
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", dados.putUrl as string);
      xhr.setRequestHeader("Content-Type", mime);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("envio recusado pelo armazenamento")));
      xhr.onerror = () => reject(new Error("conexão caiu"));
      xhr.send(blob);
    });
    const conf = await fetch("/api/media/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dados.id, key: dados.key, tamanho: blob.size, mime, largura: dim.largura, altura: dim.altura }),
    });
    const cd = await conf.json();
    if (!conf.ok) {
      const lista = (cd.problemas as { motivo: string; correcao: string }[] | undefined) ?? [];
      throw new Error(lista.length ? lista.map((p) => `${p.motivo} (${p.correcao})`).join("; ") : (cd.error ?? "o arquivo não confere"));
    }
    return dados.url as string;
  }

  async function processar(fila: { blob: Blob; name: string }[]) {
    setUploading(true);
    setError(null);
    const restante = [...fila];
    try {
      while (restante.length) {
        const item = restante[0];
        const feitos = fila.length - restante.length;
        const url = await enviarArquivo(item.blob, item.name, (pct) =>
          setUpProg({ nome: item.name, pct, feitos, total: fila.length }),
        );
        setMedia((m) => [...m, url]);
        restante.shift();
      }
      setPendentes([]);
      setUpProg(null);
    } catch (e) {
      setPendentes(restante);
      setUpProg(null);
      setError(`${e instanceof Error ? e.message : "falha no envio"}. Enviados ${fila.length - restante.length} de ${fila.length}. Continue quando a conexão voltar.`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const fila: { blob: Blob; name: string }[] = [];
    const videos: File[] = [];
    for (const f of Array.from(files)) {
      if (f.type.startsWith("video/")) videos.push(f);
      else fila.push(await compressImage(f));
    }
    if (fila.length) await processar(fila);
    for (const v of videos) await enviarVideo(v);
  }

  async function submit(mode: CreateInput["mode"]) {
    setError(null);
    if (!brand) return setError("Selecione uma marca.");
    if (media.length === 0) return setError("Adicione ao menos uma imagem.");
    if (mode === "agendar" && !scheduledAt) return setError("Escolha data e hora do agendamento.");

    setBusy(mode);
    const res = await createPostAction({
      idem: idemRef.current,
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
      try {
        localStorage.removeItem("ms_rascunho_legenda");
      } catch {
        // sem persistencia
      }
      router.push("/posts");
    } else {
      setError(res.error);
      setBusy(null);
    }
  }

  // D14: gera as tres variacoes de uma vez; "Regenerar" refaz so a que for pedida
  async function gerarVariante(i: number, tomV: string, tamanhoV: string) {
    if (!brand) return setError("Selecione uma marca.");
    setError(null);
    setVarBusy((b) => [...b, i]);
    try {
      const r = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brand.id,
          atual: legenda,
          tipo,
          tom: tomV,
          tamanho: tamanhoV,
          template,
          assunto,
          segmento,
        }),
      });
      if (sessaoExpirou(r)) return;
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falha na IA");
      const texto = String(data.caption ?? "");
      setVariantes((vs) => vs.map((v, j) => (j === i ? { texto, tom: tomV, tamanho: tamanhoV } : v)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "falha na IA");
    } finally {
      setVarBusy((b) => b.filter((x) => x !== i));
    }
  }

  async function gerarTres() {
    if (!brand) return setError("Selecione uma marca.");
    const t = tom;
    setVariantes([0, 1, 2].map(() => ({ texto: "", tom: t, tamanho })));
    await Promise.all([0, 1, 2].map((i) => gerarVariante(i, t, tamanho)));
  }

  function usarVariante(texto: string) {
    setLegenda(texto);
    setStudioOpen(false);
    setVariantes([]);
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
      if (sessaoExpirou(r)) return;
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
  const pill = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-xs transition-colors ${
      active ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
    }`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Editor em passos */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n, i) => (
            <div key={n} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStep(n)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  step === n ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
                }`}
              >
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${step >= n ? "bg-ink text-canvas" : "bg-panel2 text-faint"}`}>
                  {n}
                </span>
                {["Marca", "Tipo", "Mídia", "Legenda", "Agendar"][i]}
              </button>
              {i < 4 && <span className="text-faint">›</span>}
            </div>
          ))}
        </div>

        {/* D12: marca e tipo na mesma tela (passos 1 e 2), com cartoes */}
        {(step === 1 || step === 2) && (
        <div>
          <label className={labelCls}>Marca</label>
          {/* M07: no celular, marcas em faixa horizontal */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4">
            {brands.map((b) => {
              const sel = brandId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrandId(b.id)}
                  className={`flex min-w-44 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors sm:min-w-0 ${
                    sel ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
                  }`}
                >
                  <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: b.cor_principal }} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{b.nome}</span>
                    {/* D12: status do Instagram e ultimo post da marca */}
                    <span className="block text-[11px] text-faint">
                      <span className={b.ig ? "text-ok" : "text-warn"}>{b.ig ? "Instagram ✓" : "Instagram pendente"}</span>
                      {" · "}
                      {b.ultimo ? `último post ${new Date(b.ultimo).toLocaleDateString("pt-BR")}` : "sem posts ainda"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {(step === 1 || step === 2) && (
        <div>
          <label className={labelCls}>Tipo de publicação</label>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3">
            {[
              { v: "image", t: "Imagem", d: "quadrada 1:1 ou 4:5" },
              { v: "carousel", t: "Carrossel", d: "2 ou mais imagens" },
              { v: "reel", t: "Reel", d: "vídeo vertical 9:16" },
            ].map((c) => (
              <button
                key={c.v}
                type="button"
                onClick={() => setTipo(c.v as CreateInput["tipo"])}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  tipo === c.v ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
                }`}
              >
                <span className="block text-sm font-medium">{c.t}</span>
                <span className="block text-[11px] text-faint">{c.d}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">A prévia ao lado acompanha o formato escolhido.</p>
        </div>
        )}

        {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Formato da arte</label>
            <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
              {FORMATOS.map((f) => (
                <button key={f.v} type="button" onClick={() => setFormato(f.v)} className={seg(formato === f.v)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        <div>
          <label className={labelCls}>Mídia {tipo === "carousel" && <span className="text-faint">(2+ imagens)</span>}</label>
          {media.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {media.map((url, i) => {
                const pr = rotuloProp(proporcoes[url]);
                return (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIdx !== null) moverMidia(dragIdx, i);
                      setDragIdx(null);
                    }}
                    onDragEnd={() => setDragIdx(null)}
                    className="group relative h-20 w-20 cursor-grab overflow-hidden rounded-md border border-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {ehVideo(url) ? (
                      <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    )}
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[9px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span
                      className={`absolute bottom-1 left-1 rounded px-1 text-[9px] font-medium ${pr.ok ? "bg-black/60 text-white" : "bg-warn text-black"}`}
                      title={pr.ok ? "proporção ok" : "esta imagem não bate com o formato do post"}
                    >
                      {pr.t}
                    </span>
                    {!pr.ok && (
                      <button type="button" onClick={() => recortarPara(url)} className="absolute bottom-6 left-1 rounded bg-warn px-1.5 py-0.5 text-[9px] font-medium text-black">
                        recortar
                      </button>
                    )}
                    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moverMidia(i, i - 1)}
                        disabled={i === 0}
                        aria-label="Mover para antes"
                        className="grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[10px] text-white disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moverMidia(i, i + 1)}
                        disabled={i === media.length - 1}
                        aria-label="Mover para depois"
                        className="grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[10px] text-white disabled:opacity-30"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMedia((m) => m.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remover"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {media.length > 1 && (
            <p className="mt-2 text-[11px] text-faint">Arraste para mudar a ordem, ou use as setas ← →.</p>
          )}
          {media.some((u) => !rotuloProp(proporcoes[u]).ok) && (
            <p className="mt-2 text-xs text-warn">
              Uma ou mais imagens não batem com o formato do post. No feed elas podem aparecer com faixas ou cortadas.
            </p>
          )}

          <div role="tablist" aria-label="Origem da mídia" className="mt-4 inline-flex rounded-md border border-line bg-panel p-0.5">
            {MIDIA_ABAS.map((a) => (
              <button
                key={a.v}
                type="button"
                role="tab"
                aria-selected={midiaAba === a.v}
                onClick={() => setMidiaAba(a.v)}
                className={seg(midiaAba === a.v)}
              >
                {a.label}
              </button>
            ))}
          </div>

          {midiaAba === "enviar" && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="grid h-20 w-40 place-items-center rounded-md border border-dashed border-line text-xs text-faint transition-colors hover:border-line2 hover:text-dim disabled:opacity-50"
              >
                {uploading ? "enviando…" : "+ enviar imagem"}
              </button>
              <p className="mt-2 text-[11px] text-faint">Imagem ou vídeo (até 500 MB). Imagens grandes são reduzidas antes do envio.</p>
              {upProg && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[11px] text-faint">
                    <span className="truncate">{upProg.nome}</span>
                    <span>{upProg.texto ?? `${upProg.feitos + 1} de ${upProg.total}`} · {upProg.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-panel2"><div className="h-full bg-info" style={{ width: `${upProg.pct}%` }} /></div>
                </div>
              )}
              {retomada && (
                <button type="button" onClick={() => enviarVideo(retomada.file, retomada)} className="mt-2 min-h-11 rounded-md border border-line px-3 text-xs text-info">
                  Continuar envio do vídeo
                </button>
              )}
              {pendentes.length > 0 && (
                <button type="button" onClick={() => processar(pendentes)} className="mt-2 min-h-11 rounded-md border border-line px-3 text-xs text-info">
                  Continuar envio ({pendentes.length})
                </button>
              )}
            </div>
          )}

          {midiaAba === "biblioteca" && (
            <div className="mt-3">
              {bibDaMarca.length === 0 ? (
                <p className="text-xs text-faint">Nenhuma imagem guardada para {brand?.nome ?? "esta marca"} ainda.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {bibDaMarca.map((m) => {
                    const usada = media.includes(m.url);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        // D13: clicar numera a imagem (o numero e a ordem do slide); clicar de novo tira
                        onClick={() => setMedia((x) => (x.includes(m.url) ? x.filter((u) => u !== m.url) : [...x, m.url]))}
                        aria-label={usada ? "Tirar do post" : "Adicionar ao post"}
                        className="relative aspect-square overflow-hidden rounded-md border border-line transition-colors hover:border-line2 disabled:opacity-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {usada ? (
                          <span className="absolute left-1 top-1 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1 text-[11px] font-semibold text-canvas">{media.indexOf(m.url) + 1}</span>
                        ) : null}
                        {usada && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] text-white">na ordem</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {midiaAba === "gerar" && (
            <div className="mt-3 rounded-md border border-line bg-panel/50 p-3">
              <div className="mb-1.5 text-xs font-medium text-dim">Descreva a imagem</div>
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
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
        </div>
        )}

        {step === 4 && (
        <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-dim" htmlFor="legenda">
              Legenda
            </label>
            <button
              type="button"
              onClick={() => setStudioOpen((o) => !o)}
              disabled={!brand}
              className="text-xs text-info transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {studioOpen ? "fechar estúdio" : "✦ Gerar com IA"}
            </button>
          </div>

          {studioOpen && (
            <div className="mb-3 space-y-3 rounded-lg border border-line bg-panel/50 p-3">
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-dim">
                  Segmento / categoria <span className="text-faint">(opcional)</span>
                </div>
                <input
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  placeholder="ex: desenvolvimento de sistemas e apps, moda, alimentação…"
                  className={`${inputCls} text-xs`}
                />
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-dim">Tom de voz</div>
                <div className="flex flex-wrap gap-1.5">
                  {TONS.map((t) => (
                    <button key={t.v} type="button" onClick={() => setTom(t.v)} className={pill(tom === t.v)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-dim">Tamanho</div>
                <div className="flex flex-wrap gap-1.5">
                  {TAMANHOS.map((t) => (
                    <button
                      key={t.v}
                      type="button"
                      onClick={() => setTamanho(t.v)}
                      className={pill(tamanho === t.v)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-dim">Pauta</div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="rounded-md border border-line bg-panel2 px-2 py-1.5 text-xs text-dim"
                  >
                    <option value="">Livre</option>
                    {TEMPLATES.map((t) => (
                      <option key={t} value={t}>
                        {t}…
                      </option>
                    ))}
                  </select>
                  <input
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="assunto / tema (ex: usar a JetSend no e-mail marketing)"
                    className={`${inputCls} min-w-48 flex-1 text-xs`}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={gerarTres} disabled={varBusy.length > 0 || !brand} className={btnPrimary}>
                  {varBusy.length > 0 ? "gerando…" : "Gerar 3 variações"}
                </button>
                <span className="text-[11px] text-faint">escolha uma variação para usar como legenda</span>
              </div>
              {variantes.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3">
                  {/* M09: no celular, as variacoes deslizam lado a lado */}
                  {variantes.map((v, i) => (
                    <div key={i} className="flex w-64 shrink-0 flex-col rounded-md border border-line bg-panel p-2.5 sm:w-auto">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-faint">
                        <span>Variação {"ABC"[i]}</span>
                        {varBusy.includes(i) && <span className="text-info">gerando…</span>}
                      </div>
                      <p className="min-h-24 flex-1 whitespace-pre-line text-xs leading-relaxed text-ink">{v.texto || "—"}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <select
                          aria-label={`Tom da variação ${"ABC"[i]}`}
                          value={v.tom}
                          onChange={(e) => setVariantes((vs) => vs.map((x, j) => (j === i ? { ...x, tom: e.target.value } : x)))}
                          className="rounded border border-line bg-panel2 px-1.5 py-1 text-[11px] text-dim"
                        >
                          {TONS.map((t) => (
                            <option key={t.v} value={t.v}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label={`Tamanho da variação ${"ABC"[i]}`}
                          value={v.tamanho}
                          onChange={(e) => setVariantes((vs) => vs.map((x, j) => (j === i ? { ...x, tamanho: e.target.value } : x)))}
                          className="rounded border border-line bg-panel2 px-1.5 py-1 text-[11px] text-dim"
                        >
                          {TAMANHOS.map((t) => (
                            <option key={t.v} value={t.v}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => gerarVariante(i, v.tom, v.tamanho)}
                          disabled={varBusy.includes(i)}
                          className={btnGhost}
                        >
                          Regenerar
                        </button>
                        <button type="button" onClick={() => usarVariante(v.texto)} disabled={!v.texto} className={btnPrimary}>
                          Usar esta
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
          {/* M43: hashtags que a marca mais usa, um toque adiciona */}
          {(hashtagsSugeridas[brandId] ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(hashtagsSugeridas[brandId] ?? [])
                .filter((t) => !parseTags(tagsRaw).includes(t))
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagsRaw((r) => (r.trim() ? `${r.trim()} ${t}` : t))}
                    className="min-h-11 rounded-full border border-line px-3 text-xs text-info md:min-h-0 md:py-0.5"
                  >
                    #{t}
                  </button>
                ))}
            </div>
          )}
        </div>
        </div>
        )}

        {step === 5 && (
        <div>
          {/* D15: linha do tempo do dia, conflito com a mesma marca e horarios da janela */}
          {(() => {
            const dia = scheduledAt ? new Date(scheduledAt) : new Date();
            const hh = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            const doDia = agenda
              .filter((a) => new Date(a.scheduled_at).toDateString() === dia.toDateString())
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
            const escolhido = scheduledAt ? new Date(scheduledAt) : null;
            const conflito =
              escolhido && brand
                ? agenda.find(
                    (a) =>
                      a.brand_id === brand.id &&
                      Math.abs(new Date(a.scheduled_at).getTime() - escolhido.getTime()) < 60 * 60 * 1000,
                  )
                : undefined;
            const sugestoes = brand
              ? janelas
                  .filter((j) => j.brand_id === brand.id && j.weekday === dia.getDay())
                  .sort((a, b) => a.hour - b.hour || a.minute - b.minute)
              : [];
            const combina = (h: number, m: number) => {
              const x = new Date(dia);
              x.setHours(h, m, 0, 0);
              const p = (n: number) => String(n).padStart(2, "0");
              return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(h)}:${p(m)}`;
            };
            return (
              <div className="mb-4 space-y-2 rounded-lg border border-line bg-panel p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-dim">
                    Agenda de {dia.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                  {conflito && (
                    <span className="text-warn">
                      Conflito: {conflito.nome} às {hh(new Date(conflito.scheduled_at))}. Escolha outro horário ou siga com este.
                    </span>
                  )}
                </div>
                {doDia.length === 0 ? (
                  <p className="text-faint">Nenhum post agendado neste dia.</p>
                ) : (
                  <ul className="space-y-0.5 text-dim">
                    {doDia.map((a) => (
                      <li key={a.scheduled_at + a.brand_id}>
                        {hh(new Date(a.scheduled_at))} · {a.nome}
                      </li>
                    ))}
                  </ul>
                )}
                {sugestoes.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    <span className="col-span-3 text-faint">Janela de {brand?.nome}:</span>
                    {sugestoes.map((j) => (
                      <button
                        key={j.weekday + "-" + j.hour + "-" + j.minute}
                        type="button"
                        onClick={() => setScheduledAt(combina(j.hour, j.minute))}
                        className="min-h-11 rounded-md border border-line px-3 py-2 text-dim transition-colors hover:border-line2 hover:text-ink md:min-h-0 md:px-2 md:py-0.5"
                      >
                        {String(j.hour).padStart(2, "0")}:{String(j.minute).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          <label className={labelCls} htmlFor="quando">Agendar para <span className="text-faint">(opcional)</span></label>
          <input
            id="quando"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={`${inputCls} max-w-xs`}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            <span className="text-dim">Rascunho</span>: guarda sem publicar (aprovar depois em Posts).{" "}
            <span className="text-dim">Agendar</span>: usa a data acima.{" "}
            <span className="text-dim">Auto-agendar</span>: encaixa no próximo horário fixo da marca.{" "}
            <span className="text-dim">Publicar agora</span>: envia pro Instagram na hora.
          </p>
        </div>
        )}

        {error && (
          <p className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {step > 1 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className={btnGhost}>
              ‹ Voltar
            </button>
          )}
          {step < 5 && (
            <button type="button" onClick={() => setStep((s) => s + 1)} className={btnPrimary}>
              Avançar ›
            </button>
          )}
          <button type="button" onClick={() => submit("rascunho")} disabled={!!busy} className={btnGhost}>
            {busy === "rascunho" ? "salvando…" : "Salvar rascunho"}
          </button>
          {/* D16: checklist de revisao com acao para corrigir cada alerta */}
          {step === 5 && (() => {
            const dia = scheduledAt ? new Date(scheduledAt) : null;
            const conflito =
              dia && brand
                ? agenda.find(
                    (a) => a.brand_id === brand.id && Math.abs(new Date(a.scheduled_at).getTime() - dia.getTime()) < 60 * 60 * 1000,
                  )
                : undefined;
            const hh = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            const formatoOk = media.every((u) => rotuloProp(proporcoes[u]).ok);
            const itens = [
              { ok: Boolean(brand), texto: `Marca: ${brand?.nome ?? "nenhuma"}`, alerta: "Escolha uma marca", acao: "Corrigir", ir: () => setStep(1) },
              {
                ok: media.length > 0 && formatoOk,
                texto: media.length === 0 ? "Sem imagem" : `Mídia: ${media.length} arquivo(s)${formatoOk ? "" : ", algum fora do formato"}`,
                alerta: media.length === 0 ? "Adicione ao menos uma imagem" : "Troque a imagem fora do formato",
                acao: "Corrigir",
                ir: () => setStep(3),
              },
              {
                ok: legenda.trim().length > 0,
                texto: `Legenda com ${legenda.trim().length} caracteres`,
                alerta: "Escreva a legenda",
                acao: "Editar",
                ir: () => setStep(4),
              },
              conflito
                ? {
                    ok: false,
                    texto: `Horário conflita com ${conflito.nome} às ${hh(new Date(conflito.scheduled_at))}`,
                    alerta: "Escolha outro horário",
                    acao: "Mudar horário",
                    ir: () => document.getElementById("quando")?.focus(),
                  }
                : {
                    ok: true,
                    texto: dia ? `Horário ${hh(dia)} sem conflito` : "Sem horário: fica como rascunho",
                    alerta: "",
                    acao: "",
                    ir: () => {},
                  },
            ];
            const alertas = itens.filter((i) => !i.ok).length;
            return (
              <div className="mb-4 rounded-lg border border-line bg-panel p-3 text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wide text-faint">Revisão</span>
                  <span className={alertas ? "text-warn" : "text-ok"}>
                    {alertas ? `${alertas} alerta(s) antes de agendar` : "Tudo certo para agendar"}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {itens.map((i) => (
                    <li key={i.texto} className="flex items-center gap-2">
                      <span className={i.ok ? "text-ok" : "text-warn"}>{i.ok ? "✓" : "!"}</span>
                      <span className={`min-w-0 flex-1 ${i.ok ? "text-dim" : "text-warn"}`}>{i.ok ? i.texto : i.alerta + " · " + i.texto}</span>
                      {!i.ok && i.acao && (
                        <button type="button" onClick={i.ir} className="rounded-md border border-line px-2 py-0.5 text-dim transition-colors hover:text-ink">
                          {i.acao}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
          {step === 5 && (
            <>
              {/* D16: o botao muda conforme o estado: agenda se tudo certo, senao manda para aprovacao */}
              {(() => {
                const pronto = Boolean(brand) && media.length > 0 && legenda.trim().length > 0 && media.every((u) => rotuloProp(proporcoes[u]).ok);
                return pronto ? (
                  <button type="button" onClick={() => submit("agendar")} disabled={!!busy} className={btnPrimary}>
                    {busy === "agendar" ? "agendando…" : "Agendar"}
                  </button>
                ) : (
                  <button type="button" onClick={() => submit("rascunho")} disabled={!!busy} className={btnGhost}>
                    {busy === "rascunho" ? "enviando…" : "Enviar para aprovação"}
                  </button>
                );
              })()}
              <button type="button" onClick={() => submit("auto")} disabled={!!busy} className={btnGhost}>
                {busy === "auto" ? "agendando…" : "Auto-agendar"}
              </button>
              <button type="button" onClick={() => submit("publicar")} disabled={!!busy} className={btnPrimary}>
                {busy === "publicar" ? "publicando…" : "Publicar agora"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview ao vivo */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Preview</p>
        <InstagramPreview
          username={brand?.slug ?? "marca"}
          cor={brand?.cor_principal ?? "#000"}
          picture={brand?.avatar}
          media={media}
          legenda={legenda}
          hashtags={tags}
          tipo={tipo}
        />
      </div>
    </div>
  );
}
