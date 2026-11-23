import Link from "next/link";
import { listAllBrands, avatarOf } from "@/server/brands";
import { listTimeslots } from "@/server/timeslots";
import { PageHeader, btnGhost } from "@/components/ui";
import { readableOn } from "@/lib/ui";
import { refreshBrandPhotos } from "./actions";
import { postsAnalytics } from "@/server/posts";

export const dynamic = "force-dynamic";

// D22: cartoes das marcas com checagem de prontidao (Instagram, LinkedIn e horarios).
export default async function MarcasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const brands = await listAllBrands();
  const { deleted } = await postsAnalytics();
  const janelas = await Promise.all(brands.map((b) => listTimeslots(b.id)));

  const linhas = brands.map((b, i) => {
    const igOk = Boolean(b.ig_user_id) || Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]);
    const liOk = Boolean(b.linkedin_org_id);
    const horarios = janelas[i].length;
    const pendente = !igOk || !liOk || horarios === 0;
    return { b, igOk, liOk, horarios, pendente };
  });

  const ativas = brands.filter((b) => b.ativo).length;
  const comPendencia = linhas.filter((l) => l.pendente).length;
  const prontas = linhas.filter((l) => l.b.ativo && !l.pendente).length;
  const inativas = brands.length - ativas;
  // M14: o que trava vem primeiro (pendencia antes de tudo), depois o resto na ordem do cadastro
  const visiveis = linhas
    .filter((l) => {
      if (filtro === "pendencia") return l.pendente;
      if (filtro === "inativas") return !l.b.ativo;
      return true;
    })
    .sort((a, b) => Number(b.pendente) - Number(a.pendente));

  const chip = (label: string, n: number, on: boolean, href: string) => (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        on ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
      }`}
    >
      {label} <span className="text-faint">{n}</span>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Marcas"
        subtitle={`${brands.length} produtos · ${prontas} prontos para publicar · ${comPendencia} com pendência · ${deleted} posts excluídos`}
        action={
          <form action={refreshBrandPhotos}>
            <button className={btnGhost} title="Puxa a foto de perfil das contas Instagram conectadas">
              Atualizar fotos
            </button>
          </form>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {chip("Todas", brands.length, !filtro, "/marcas")}
        {chip("Com pendência", comPendencia, filtro === "pendencia", "/marcas?filtro=pendencia")}
        {chip("Inativas", inativas, filtro === "inativas", "/marcas?filtro=inativas")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map(({ b, igOk, liOk, horarios, pendente }) => (
          <div key={b.id} className="group relative overflow-hidden rounded-lg border border-line bg-panel p-5 transition-colors hover:border-line2">
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: b.cor_principal }} />
            <Link href={`/marcas/${b.slug}`} className="flex items-center gap-3">
              {avatarOf(b) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarOf(b)!} alt="" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold"
                  style={{ background: b.cor_principal, color: readableOn(b.cor_principal) }}
                >
                  {b.nome[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-ink">{b.nome}</span>
                  {!b.ativo && <span className="shrink-0 text-[11px] text-faint">inativa</span>}
                </div>
                <div className="font-mono text-xs text-faint">@{b.slug}</div>
              </div>
            </Link>

            <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-relaxed text-dim">
              {b.tom_voz || "sem tom de voz definido"}
            </p>

            {/* checagens de prontidao: o que falta aparece em amarelo, com o link para a secao certa */}
            <ul className="mt-4 space-y-1 text-xs">
              <li>
                {igOk ? (
                  <span className="text-ok">✓ Instagram conectado</span>
                ) : (
                  <Link href={`/marcas/${b.slug}/conectar`} className="text-warn hover:underline">
                    ○ Instagram pendente → conectar
                  </Link>
                )}
              </li>
              <li>
                {liOk ? (
                  <span className="text-ok">✓ LinkedIn conectado</span>
                ) : (
                  <Link href={`/marcas/${b.slug}`} className="text-faint hover:text-dim">
                    ○ LinkedIn aguarda aprovação
                  </Link>
                )}
              </li>
              <li>
                {horarios > 0 ? (
                  <span className="text-dim">✓ Horários {horarios} por semana</span>
                ) : (
                  <Link href={`/marcas/${b.slug}`} className="text-warn hover:underline">
                    ○ Sem horários fixos → definir
                  </Link>
                )}
              </li>
            </ul>

            <div className="mt-3 truncate text-[11px] text-faint">{b.site_url?.replace(/^https?:\/\//, "")}</div>
            {pendente && <span className="sr-only">com pendência</span>}
          </div>
        ))}
      </div>
    </>
  );
}
