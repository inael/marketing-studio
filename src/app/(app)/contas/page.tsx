import Link from "next/link";
import { listAllBrands } from "@/server/brands";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

// D24: todas as contas de todas as marcas numa lista, com o estado de cada uma e a acao.
// O LinkedIn aparece como "aguarda aprovação" enquanto a conta da marca nao esta vinculada.
export default async function ContasPage() {
  const marcas = await listAllBrands();
  const linhas = marcas.flatMap((b) => {
    const igConectada = Boolean(b.ig_user_id) || Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]);
    const expira = (b as unknown as { ig_token_expira_em?: string | null }).ig_token_expira_em;
    const diasIg = expira ? Math.ceil((new Date(expira).getTime() - Date.now()) / 86400000) : null;
    const liConectada = Boolean(b.linkedin_org_id);
    return [
      {
        key: `${b.slug}-ig`,
        marca: b.nome,
        cor: b.cor_principal,
        rede: "Instagram",
        conta: b.ig_user_id ? `@${b.slug}` : "—",
        estado: igConectada ? (diasIg !== null && diasIg <= 7 ? `Token: ${diasIg} dia(s)` : "Conectada") : "Não conectada",
        ok: igConectada && (diasIg === null || diasIg > 7),
        href: `/marcas/${b.slug}/conectar`,
        acao: igConectada ? "Reconectar" : "Conectar",
      },
      {
        key: `${b.slug}-li`,
        marca: b.nome,
        cor: b.cor_principal,
        rede: "LinkedIn",
        conta: liConectada ? b.linkedin_org_id ?? "" : "—",
        estado: liConectada ? "Conectada" : "Aguarda aprovação",
        ok: liConectada,
        href: `/marcas/${b.slug}`,
        acao: liConectada ? "Ver" : "Ver marca",
      },
    ];
  });

  return (
    <>
      <PageHeader title="Contas" subtitle="Todas as contas das marcas, com o estado de cada rede" />
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              <th className="px-4 py-2 font-medium">Marca</th>
              <th className="px-4 py-2 font-medium">Rede</th>
              <th className="px-4 py-2 font-medium">Conta</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.key} className="border-b border-line/60">
                <td className="px-4 py-2">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: l.cor }} />
                  <span className="text-ink">{l.marca}</span>
                </td>
                <td className="px-4 py-2 text-dim">{l.rede}</td>
                <td className="px-4 py-2 font-mono text-xs text-faint">{l.conta}</td>
                <td className={`px-4 py-2 text-xs ${l.ok ? "text-ok" : "text-warn"}`}>{l.estado}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={l.href} className="text-xs text-info hover:underline">{l.acao} →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
