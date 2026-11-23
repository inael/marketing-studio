import Link from "next/link";
import { notFound } from "next/navigation";
import { listMedia } from "@/server/media";
import { listAllBrands } from "@/server/brands";
import { listPosts } from "@/server/posts";
import { PageHeader, StatusBadge } from "@/components/ui";
import { fmtDate } from "@/lib/ui";
import { getSettings } from "@/server/settings";
import { salvarVersaoMidia } from "../actions";

export const dynamic = "force-dynamic";

// D21: ficha de uma midia: onde ja foi usada e de onde veio.
export default async function MidiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [media, brands, posts] = await Promise.all([listMedia(), listAllBrands(), listPosts()]);
  const m = media.find((x) => x.id === id);
  if (!m) notFound();

  const b = m.brand_id ? brands.find((x) => x.id === m.brand_id) : undefined;
  // D21: historico simulado de versoes (o arquivo original sempre e a primeira)
  const cfg = await getSettings();
  let lista: { quando: string; nota: string }[] = [];
  try {
    lista = JSON.parse(cfg[`midia.versoes.${m.id}`] || "[]");
  } catch {
    lista = [];
  }
  const versoes = [...lista, { quando: m.created_at, nota: "arquivo original" }];
  const usadaEm = posts.filter((p) => !p.deleted_at && p.media.includes(m.url));

  return (
    <>
      <PageHeader
        title="Mídia"
        subtitle={`${b?.nome ?? "Sem marca"} · ${m.tipo === "video" ? "vídeo" : "imagem"}`}
        action={
          <Link href="/biblioteca" className="rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:text-ink">
            ← Biblioteca
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg border border-line bg-panel2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt="" className="h-full w-full object-contain" />
        </div>

        <div className="space-y-5 text-sm">
          <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2">
            <dt className="text-faint">Marca</dt>
            <dd className="text-ink">{b?.nome ?? "Sem marca"}</dd>
            <dt className="text-faint">Tipo</dt>
            <dd className="text-ink">{m.tipo === "video" ? "Vídeo" : "Imagem"}</dd>
            <dt className="text-faint">Origem</dt>
            <dd className="text-ink">{m.origem ?? "upload"}</dd>
            <dt className="text-faint">Enviada em</dt>
            <dd className="text-ink">{fmtDate(m.created_at)}</dd>
            <dt className="text-faint">Endereço</dt>
            <dd className="truncate font-mono text-xs text-dim">{m.url}</dd>
          </dl>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
              Usada em {usadaEm.length} {usadaEm.length === 1 ? "post" : "posts"}
            </h2>
            {usadaEm.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-6 text-center text-xs text-faint">
                Esta mídia ainda não foi usada em nenhum post.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {usadaEm.map((p) => {
                  const pb = brands.find((x) => x.id === p.brand_id);
                  return (
                    <li key={p.id}>
                      <Link
                        href="/posts"
                        className="flex items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2 transition-colors hover:border-line2"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: pb?.cor_principal ?? "#888" }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink">{p.legenda?.trim() || "(sem legenda)"}</span>
                          <span className="block text-[11px] text-faint">
                            {pb?.nome ?? "?"} · {fmtDate(p.scheduled_at ?? p.created_at)}
                          </span>
                        </span>
                        <StatusBadge status={p.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* D21: versoes lado a lado: a original e as derivadas; a recomendada fica marcada */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">Versões</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {versoes.map((v, i) => (
                <div key={i} className="space-y-2 rounded-md border border-line p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt="" className="aspect-square w-full rounded object-cover" />
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-dim">{v.nota}</span>
                    {i === versoes.length - 1 ? <span className="rounded bg-ok/15 px-1.5 py-0.5 text-[10px] text-ok">original</span> : <span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] text-faint">derivada</span>}
                  </div>
                  <div className="text-[11px] text-faint">{new Date(v.quando).toLocaleString("pt-BR")}</div>
                </div>
              ))}
            </div>
            <form action={salvarVersaoMidia.bind(null, m.id)} className="mt-3 flex flex-wrap gap-2">
              <select name="nota" defaultValue="Recorte para story (9:16)" className="min-h-11 rounded-md border border-line bg-panel2 px-3 text-sm text-ink">
                <option>Recorte para story (9:16)</option>
                <option>Feed 4:5</option>
                <option>Com título</option>
              </select>
              <button className="min-h-11 rounded-md border border-line px-3 text-xs text-dim hover:text-ink">Criar nova versão desta</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
