import Link from "next/link";
import { listPosts } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { listMedia } from "@/server/media";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

// M33: busca com resultados agrupados por tipo (posts, marcas e midia). Filtro por grupo com um toque.
export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string; grupo?: string }> }) {
  const { q: qRaw, grupo } = await searchParams;
  const q = (qRaw ?? "").trim().toLowerCase();
  const [posts, marcas, midia] = await Promise.all([listPosts(), listAllBrands(), listMedia()]);

  const bate = (t: string | null | undefined) => (t ?? "").toLowerCase().includes(q);
  const pPosts = q ? posts.filter((p) => !p.deleted_at && (bate(p.legenda) || p.hashtags.some((h) => bate(h)))) : [];
  const pMarcas = q ? marcas.filter((m) => bate(m.nome) || bate(m.slug)) : [];
  const pMidia = q ? midia.filter((m) => bate(m.url)) : [];
  const nome = new Map(marcas.map((m) => [m.id, m.nome]));

  const grupos = [
    { v: "posts", label: "Posts", n: pPosts.length },
    { v: "marcas", label: "Marcas", n: pMarcas.length },
    { v: "midia", label: "Mídia", n: pMidia.length },
  ];
  const ver = (v: string) => !grupo || grupo === v;

  return (
    <>
      <PageHeader title="Buscar" subtitle={q ? `“${qRaw}”` : "posts, marcas e mídia"} />
      <form action="/busca" className="mb-4">
        <input
          name="q"
          defaultValue={qRaw ?? ""}
          placeholder="Buscar em posts, marcas e mídia"
          className="min-h-11 w-full rounded-md border border-line bg-panel2 px-3 text-sm text-ink"
        />
      </form>

      {q && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Link href={`/busca?q=${encodeURIComponent(qRaw ?? "")}`} className={`min-h-11 rounded-full border px-4 py-2 text-xs md:min-h-0 ${!grupo ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"}`}>Todos</Link>
          {grupos.map((g) => (
            <Link key={g.v} href={`/busca?q=${encodeURIComponent(qRaw ?? "")}&grupo=${g.v}`} className={`min-h-11 rounded-full border px-4 py-2 text-xs md:min-h-0 ${grupo === g.v ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"}`}>
              {g.label} <span className="text-faint">{g.n}</span>
            </Link>
          ))}
        </div>
      )}

      {q && ver("posts") && pPosts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Posts · {pPosts.length}</h2>
          <ul className="space-y-2">
            {pPosts.slice(0, 30).map((p) => (
              <li key={p.id}>
                <Link href="/posts" className="block rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink">
                  <span className="block truncate">{p.legenda?.trim() || "post sem legenda"}</span>
                  <span className="block text-[11px] text-faint">{nome.get(p.brand_id) ?? "marca"} · {p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && ver("marcas") && pMarcas.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Marcas · {pMarcas.length}</h2>
          <ul className="space-y-2">
            {pMarcas.map((m) => (
              <li key={m.id}>
                <Link href={`/marcas/${m.slug}`} className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink">
                  <span className="h-3 w-3 rounded-full" style={{ background: m.cor_principal }} />
                  {m.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {q && ver("midia") && pMidia.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Mídia · {pMidia.length}</h2>
          <div className="grid grid-cols-3 gap-2">
            {pMidia.slice(0, 30).map((m) => (
              <Link key={m.id} href={`/biblioteca/${m.id}`} className="aspect-square overflow-hidden rounded-md border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {q && pPosts.length + pMarcas.length + pMidia.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-faint">Nada encontrado para “{qRaw}”.</p>
      )}
    </>
  );
}
