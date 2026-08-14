import Link from "next/link";
import { listPosts } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { approvePost, publishPostAction, removePost } from "./actions";
import { PageHeader, StatusBadge, Empty, btnPrimary } from "@/components/ui";
import { TIPO, FORMATO, STATUS, fmtDate, type StatusKey } from "@/lib/ui";

export const dynamic = "force-dynamic";

const STATUS_ORDER: StatusKey[] = ["draft", "approved", "scheduled", "published", "failed"];

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; status?: string }>;
}) {
  const { brand: brandSlug, status } = await searchParams;
  const brands = await listAllBrands();
  const byId = new Map(brands.map((b) => [b.id, b]));
  const activeBrand = brandSlug ? brands.find((b) => b.slug === brandSlug) : undefined;

  let posts = await listPosts(activeBrand?.id);
  if (status) posts = posts.filter((p) => p.status === status);

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

  const q = (b?: string, s?: string) => {
    const p = new URLSearchParams();
    if (b) p.set("brand", b);
    if (s) p.set("status", s);
    const str = p.toString();
    return str ? `/posts?${str}` : "/posts";
  };

  return (
    <>
      <PageHeader
        title="Posts"
        subtitle={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        action={
          <Link href="/criar" className={btnPrimary}>
            Criar post
          </Link>
        }
      />

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {chip("Todas as marcas", !brandSlug, q(undefined, status))}
          {brands.map((b) =>
            chip(b.nome, brandSlug === b.slug, q(b.slug, status), b.cor_principal)
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {chip("Todos", !status, q(brandSlug, undefined))}
          {STATUS_ORDER.map((s) => chip(STATUS[s].label, status === s, q(brandSlug, s), STATUS[s].dot))}
        </div>
      </div>

      {posts.length === 0 ? (
        <Empty
          title="Nenhum post por aqui"
          hint="Crie o primeiro post ou ajuste os filtros acima."
          action={
            <Link href="/criar" className={btnPrimary}>
              Criar post
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => {
            const b = byId.get(p.brand_id);
            const thumb = p.media[0];
            return (
              <li
                key={p.id}
                className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-line bg-panel py-3 pl-5 pr-4"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: b?.cor_principal ?? "#3a3a40" }}
                />
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-panel2">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] text-faint">
                      sem mídia
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">
                    {p.legenda?.trim() || <span className="text-faint">(sem legenda)</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                    <span className="font-mono">@{b?.slug ?? "?"}</span>
                    {p.origem === "auto" && (
                      <span className="rounded-full border border-info/40 px-1.5 py-0.5 text-[10px] text-info" title="Gerado automaticamente pelo time">
                        ✦ time
                      </span>
                    )}
                    <span>·</span>
                    <span>{TIPO[p.tipo] ?? p.tipo}</span>
                    <span>·</span>
                    <span>{FORMATO[p.formato] ?? p.formato}</span>
                    {p.media.length > 1 && (
                      <>
                        <span>·</span>
                        <span>{p.media.length} mídias</span>
                      </>
                    )}
                    {p.scheduled_at && (
                      <>
                        <span>·</span>
                        <span className="text-warn">{fmtDate(p.scheduled_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={p.status} />
                  <div className="flex items-center gap-1.5">
                    {p.status === "draft" && (
                      <form action={approvePost.bind(null, p.id)}>
                        <button className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:border-ok/50 hover:text-ok">
                          Aprovar
                        </button>
                      </form>
                    )}
                    {(p.status === "approved" || p.status === "scheduled") && (
                      <form action={publishPostAction.bind(null, p.id)}>
                        <button className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:border-info/50 hover:text-info">
                          Publicar
                        </button>
                      </form>
                    )}
                    {p.external_url && (
                      <a
                        href={p.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink"
                      >
                        Ver
                      </a>
                    )}
                    <form action={removePost.bind(null, p.id)}>
                      <button
                        className="rounded-md border border-line px-2.5 py-1 text-xs text-faint transition-colors hover:border-bad/50 hover:text-bad"
                        title="Excluir"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
