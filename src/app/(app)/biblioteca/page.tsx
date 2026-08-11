import Link from "next/link";
import { listMedia } from "@/server/media";
import { listAllBrands } from "@/server/brands";
import { removeMedia } from "./actions";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand: brandSlug } = await searchParams;
  const brands = await listAllBrands();
  const byId = new Map(brands.map((b) => [b.id, b]));
  const active = brandSlug ? brands.find((b) => b.slug === brandSlug) : undefined;
  const media = await listMedia(active?.id);

  const q = (slug?: string) => (slug ? `/biblioteca?brand=${slug}` : "/biblioteca");
  const chip = (label: string, on: boolean, href: string, dot?: string) => (
    <Link
      key={href + label}
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
        subtitle={`${media.length} ${media.length === 1 ? "item" : "itens"}`}
        action={
          <Link href="/criar" className={btnPrimary}>
            Criar post
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {chip("Todas as marcas", !brandSlug, q())}
        {brands.map((b) => chip(b.nome, brandSlug === b.slug, q(b.slug), b.cor_principal))}
      </div>

      {media.length === 0 ? (
        <Empty
          title="Nenhuma mídia ainda"
          hint="As imagens que você sobe no Criar ficam guardadas aqui, por marca."
          action={
            <Link href="/criar" className={btnPrimary}>
              Criar post
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {media.map((m) => {
            const b = m.brand_id ? byId.get(m.brand_id) : undefined;
            return (
              <div
                key={m.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-panel2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {b && (
                  <span
                    className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-black/50"
                    style={{ background: b.cor_principal }}
                    title={b.nome}
                  />
                )}
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
