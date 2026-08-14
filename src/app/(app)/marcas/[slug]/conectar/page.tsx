import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/server/brands";
import { getOauthSession } from "@/server/oauth";
import { finalizeInstagram, finalizeLinkedin } from "../../actions";
import { PageHeader, btnGhost } from "@/components/ui";

export const dynamic = "force-dynamic";

type Item = { id: string; label: string; sublabel: string; picture: string | null };

export default async function ConectarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { slug } = await params;
  const { s } = await searchParams;
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const session = s ? await getOauthSession(s) : null;
  const kind: "instagram" | "linkedin" = session?.kind === "linkedin" ? "linkedin" : "instagram";
  const rede = kind === "linkedin" ? "LinkedIn" : "Instagram";

  const items: Item[] =
    kind === "linkedin"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session?.orgs ?? []).map((o: any) => ({ id: o.orgId, label: o.name, sublabel: "Página de empresa", picture: null }))
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session?.accounts ?? []).map((a: any) => ({ id: a.igId, label: `@${a.username}`, sublabel: a.page, picture: a.picture }));

  return (
    <>
      <PageHeader
        title={`Conectar ${rede}`}
        subtitle={`Escolha a conta do produto ${brand.nome}`}
        action={
          <Link href={`/marcas/${slug}`} className={btnGhost}>
            Cancelar
          </Link>
        }
      />

      {items.length === 0 ? (
        <p className="text-sm text-dim">
          Sessão expirada ou nenhuma conta encontrada.{" "}
          <Link href={`/marcas/${slug}`} className="text-info hover:underline">
            Volte
          </Link>{" "}
          e clique em Conectar de novo.
        </p>
      ) : (
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
          {items.map((it) => {
            const action =
              kind === "linkedin"
                ? finalizeLinkedin.bind(null, brand.id, brand.slug, s ?? "", it.id)
                : finalizeInstagram.bind(null, brand.id, brand.slug, s ?? "", it.id);
            return (
              <form key={it.id} action={action}>
                <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel p-4 text-left transition-colors hover:border-line2">
                  {it.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.picture}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel2 text-[11px] text-dim">
                      {rede[0]}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm text-ink">{it.label}</div>
                    <div className="truncate text-xs text-faint">{it.sublabel}</div>
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      )}
    </>
  );
}
