import Link from "next/link";
import { listAllBrands } from "@/server/brands";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MarcasPage() {
  const brands = await listAllBrands();

  return (
    <>
      <PageHeader title="Marcas" subtitle={`${brands.length} produtos no estúdio`} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const igOk =
            Boolean(b.ig_user_id) ||
            Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]);
          return (
            <Link
              key={b.id}
              href={`/marcas/${b.slug}`}
              className="group relative overflow-hidden rounded-lg border border-line bg-panel p-5 transition-colors hover:border-line2"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: b.cor_principal }}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{b.nome}</span>
                {!b.ativo && <span className="text-[11px] text-faint">inativa</span>}
              </div>
              <div className="mt-0.5 font-mono text-xs text-faint">@{b.slug}</div>
              <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-relaxed text-dim">
                {b.tom_voz || "sem tom de voz definido"}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className={igOk ? "text-ok" : "text-faint"}>
                  {igOk ? "IG conectado" : "IG pendente"}
                </span>
                <span className="truncate text-faint">
                  {b.site_url?.replace(/^https?:\/\//, "")}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
