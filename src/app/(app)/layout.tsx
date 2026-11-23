import { redirect } from "next/navigation";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { AppShell } from "@/components/side-nav";
import { listAllBrands } from "@/server/brands";
import { getMarcaAtivaSlug } from "@/server/marca-ativa";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let ctx: Awaited<ReturnType<typeof getLogtoContext>>;
  try {
    ctx = await getLogtoContext(logtoConfig, { fetchUserInfo: true });
  } catch {
    // Sessão velha (refresh token expirado → oidc.invalid_grant) ou Logto fora:
    // manda pro sign-in pra renovar o cookie em vez de estourar 500.
    redirect("/logto/sign-in");
  }
  const { isAuthenticated, claims, userInfo } = ctx;
  if (!isAuthenticated) redirect("/logto/sign-in");

  const who = userInfo?.name ?? claims?.name ?? claims?.email ?? claims?.sub ?? "conta";
  const picture = (userInfo?.picture ?? claims?.picture) as string | undefined;

  // D05: marca ativa (cookie) e lista de marcas para o seletor global
  const [brands, slug] = await Promise.all([listAllBrands(), getMarcaAtivaSlug()]);
  const marcas = brands
    .filter((b) => b.ativo)
    .map((b) => ({ slug: b.slug, nome: b.nome, cor: b.cor_principal }));
  const marcaAtiva = marcas.some((m) => m.slug === slug) ? slug : null;

  return (
    <AppShell who={String(who)} picture={picture} marcas={marcas} marcaAtiva={marcaAtiva}>
      {children}
    </AppShell>
  );
}
