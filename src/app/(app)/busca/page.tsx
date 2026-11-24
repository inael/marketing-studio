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
      <form action="/busca" className="mb-6 flex items-center gap-2 rounded-xl border border-line bg-panel p-1.5 pl-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4 shrink-0 text-faint" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
        <input
          name="q"
          defaultValue={qRaw ?? ""}
          placeholder="Digite uma palavra da legenda, uma hashtag, uma marca ou um analista"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-faint outline-none"
        />
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-warn px-4 text-sm font-semibold text-canvas">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
          Buscar
        </button>
      </form>

      {!q && (
        <div className="space-y-8">
          {/* o que dá para procurar, com o tamanho de cada conjunto */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { href: "/posts", titulo: "Posts", n: posts.filter((p) => !p.deleted_at).length, texto: "legenda e hashtags" },
              { href: "/marcas", titulo: "Marcas", n: marcas.length, texto: "nome e identificador" },
              { href: "/biblioteca", titulo: "Mídia", n: midia.length, texto: "arquivos enviados" },
            ].map((c) => (
              <Link key={c.titulo} href={c.href} className="group rounded-xl border border-line bg-panel p-5 transition-colors hover:border-line2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{c.titulo}</span>
                  <span className="font-display text-2xl font-semibold text-ink">{c.n}</span>
                </div>
                <div className="mt-1 text-xs text-faint">buscável por {c.texto}</div>
              </Link>
            ))}
          </div>

          {/* atalhos: uma busca por marca, com um toque */}
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Buscar por marca</div>
            <div className="flex flex-wrap gap-2">
              {marcas.map((m) => (
                <Link key={m.id} href={`/busca?q=${encodeURIComponent(m.nome)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-panel px-3.5 text-sm text-dim transition-colors hover:text-ink">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: m.cor_principal }} />
                  {m.nome}
                </Link>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-3 rounded-xl border border-dashed border-line px-4 py-4 text-xs text-faint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="mt-0.5 h-4 w-4 shrink-0" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg>
            <span>A busca encontra o texto da legenda e as hashtags dos posts, o nome das marcas e o endereço dos arquivos de mídia. Os resultados aparecem agrupados por tipo, e você pode filtrar por grupo.</span>
          </p>
        </div>
      )}

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
