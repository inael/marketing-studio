import Link from "next/link";
import { getMarcaAtivaSlug } from "@/server/marca-ativa";
import { listMedia } from "@/server/media";
import { listAllBrands } from "@/server/brands";
import { listPosts } from "@/server/posts";
import { removeMedia } from "./actions";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

// D20: grade da biblioteca com filtros por marca, tipo e uso, e selo com os posts que usam cada arquivo.
export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; tipo?: string; uso?: string; erro?: string }>;
}) {
  const { brand: brandParam, tipo, uso, erro } = await searchParams;
  const brandSlug = brandParam ?? (await getMarcaAtivaSlug()) ?? undefined;
  const brands = await listAllBrands();
  const byId = new Map(brands.map((b) => [b.id, b]));
  const active = brandSlug ? brands.find((b) => b.slug === brandSlug) : undefined;
  const [mediaTodas, posts] = await Promise.all([listMedia(active?.id), listPosts()]);

  // quantos posts (nao excluidos) usam cada arquivo
  const usos = new Map<string, number>();
  for (const p of posts) {
    if (p.deleted_at) continue;
    for (const url of p.media) usos.set(url, (usos.get(url) ?? 0) + 1);
  }

  const media = mediaTodas.filter((m) => {
    if (tipo === "video" && m.tipo !== "video") return false;
    if (tipo === "imagem" && m.tipo === "video") return false;
    const n = usos.get(m.url) ?? 0;
    if (uso === "sem" && n > 0) return false;
    if (uso === "usado" && n === 0) return false;
    return true;
  });

  const q = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { brand: brandSlug, tipo, uso, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/biblioteca?${s}` : "/biblioteca";
  };
  const chip = (label: string, on: boolean, href: string, dot?: string, grupo = "") => (
    <Link
      key={grupo + href + label}
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        on ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Biblioteca"
        subtitle={`${media.length} de ${mediaTodas.length} ${mediaTodas.length === 1 ? "item" : "itens"}`}
        action={
          <Link href="/criar" className={`${btnPrimary} gap-2`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Criar post
          </Link>
        }
      />

      {erro && <p className="mb-3 rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{erro}</p>}
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-line bg-panel p-3">
        {chip("Todas as marcas", !brandSlug, q({ brand: undefined }))}
        {brands.map((b) => chip(b.nome, brandSlug === b.slug, q({ brand: b.slug }), b.cor_principal))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-panel p-3 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Tipo</span>
        {chip("Todos", !tipo, q({ tipo: undefined }), undefined, "tipo")}
        {chip("Imagem", tipo === "imagem", q({ tipo: "imagem" }))}
        {chip("Vídeo", tipo === "video", q({ tipo: "video" }))}
        <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Uso</span>
        {chip("Todos", !uso, q({ uso: undefined }), undefined, "uso")}
        {chip("Sem uso", uso === "sem", q({ uso: "sem" }))}
        {chip("Já usados", uso === "usado", q({ uso: "usado" }))}
      </div>

      {mediaTodas.length === 0 ? (
        <Empty
          title="Nenhuma mídia ainda"
          hint="As imagens que você sobe no Criar ficam guardadas aqui, por marca."
          action={
            <Link href="/criar" className={btnPrimary}>
              Criar post
            </Link>
          }
        />
      ) : media.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-10 text-center text-sm text-faint">
          Nenhum arquivo com esses filtros.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {/* M13: tres colunas no celular, com o selo de uso em cada item */}
          {media.map((m) => {
            const b = m.brand_id ? byId.get(m.brand_id) : undefined;
            const n = usos.get(m.url) ?? 0;
            return (
              <div
                key={m.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-panel2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {/* D21: abre a ficha da midia */}
                <Link href={`/biblioteca/${m.id}`} className="absolute inset-0" aria-label="Abrir ficha da mídia" />
                {b && (
                  <span
                    className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-black/50"
                    style={{ background: b.cor_principal }}
                    title={b.nome}
                  />
                )}
                <span
                  className={`absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    n === 0 ? "bg-black/60 text-white/80" : "bg-black/70 text-white"
                  }`}
                >
                  {n === 0 ? "sem uso" : `${n} ${n === 1 ? "uso" : "usos"}`}
                </span>
                <form
                  action={removeMedia.bind(null, m.id)}
                  className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <button
                    className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white transition-colors hover:bg-bad"
                    aria-label="Excluir"
                  >
                    ×
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
