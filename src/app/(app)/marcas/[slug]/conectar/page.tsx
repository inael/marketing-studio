import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/server/brands";
import { getOauthSession } from "@/server/oauth";
import { finalizeInstagram } from "../../actions";
import { PageHeader, btnGhost } from "@/components/ui";

export const dynamic = "force-dynamic";

type Acc = { page: string; igId: string; username: string; picture: string | null };

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
  const accounts: Acc[] = session?.accounts ?? [];

  return (
    <>
      <PageHeader
        title="Conectar Instagram"
        subtitle={`Escolha a conta do produto ${brand.nome}`}
        action={
          <Link href={`/marcas/${slug}`} className={btnGhost}>
            Cancelar
          </Link>
        }
      />

      {accounts.length === 0 ? (
        <p className="text-sm text-dim">
          Sessão expirada ou nenhuma conta encontrada.{" "}
          <Link href={`/marcas/${slug}`} className="text-info hover:underline">
            Volte
          </Link>{" "}
          e clique em Conectar de novo.
        </p>
      ) : (
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <form key={a.igId} action={finalizeInstagram.bind(null, brand.id, brand.slug, s ?? "", a.igId)}>
              <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-panel p-4 text-left transition-colors hover:border-line2">
                {a.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.picture}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel2 text-xs text-dim">
                    IG
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm text-ink">@{a.username}</div>
                  <div className="truncate text-xs text-faint">{a.page}</div>
                </div>
              </button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}
