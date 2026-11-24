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
        conta: b.ig_user_id ? `@${b.slug}` : "-",
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
        conta: liConectada ? b.linkedin_org_id ?? "" : "-",
        estado: liConectada ? "Conectada" : "Aguarda aprovação",
        ok: liConectada,
        href: `/marcas/${b.slug}`,
        acao: liConectada ? "Ver" : "Ver marca",
      },
    ];
  });

  const ig = linhas.filter((l) => l.rede === "Instagram");
  const li = linhas.filter((l) => l.rede === "LinkedIn");
  const igOk = ig.filter((l) => l.ok).length;
  const liOk = li.filter((l) => l.ok).length;

  const icone = (rede: string) =>
    rede === "Instagram" ? (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
        <path d="M4.5 9h3.2v10.5H4.5V9zm1.6-5a1.85 1.85 0 1 1 0 3.7 1.85 1.85 0 0 1 0-3.7zM10 9h3.1v1.4h.05c.43-.82 1.5-1.68 3.08-1.68 3.3 0 3.9 2.17 3.9 5v5.78h-3.2v-5.12c0-1.22-.02-2.8-1.7-2.8-1.71 0-1.97 1.33-1.97 2.72v5.2H10V9z" />
      </svg>
    );

  return (
    <div className="space-y-8">
      <PageHeader title="Contas" subtitle="Todas as contas das marcas, com o estado de cada rede" />

      {/* resumo por rede */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { rede: "Instagram", ok: igOk, total: ig.length },
          { rede: "LinkedIn", ok: liOk, total: li.length },
        ].map((r) => (
          <div key={r.rede} className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-panel2 text-warn">{icone(r.rede)}</span>
              <div>
                <div className="text-sm font-semibold text-ink">{r.rede}</div>
                <div className="text-xs text-faint">{r.total} marca(s)</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-semibold text-ink">{r.ok}<span className="text-base text-faint"> / {r.total}</span></div>
              <div className="text-xs text-dim">conectadas</div>
            </div>
          </div>
        ))}
      </div>

      {/* lista: uma linha por conta, com a mesma altura e as mesmas colunas */}
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-4 border-b border-line bg-panel2/50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
          <span>Marca</span>
          <span>Rede</span>
          <span>Conta</span>
          <span>Estado</span>
          <span className="sr-only">Ação</span>
        </div>
        <ul>
          {linhas.map((l) => (
            <li key={l.key} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-4 border-b border-line/60 px-5 py-3.5 last:border-b-0">
              <span className="flex min-w-0 items-center gap-3">
                <span aria-hidden className="h-7 w-1 shrink-0 rounded-full" style={{ background: l.cor }} />
                <span className="truncate text-sm font-medium text-ink">{l.marca}</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-dim">
                <span className="text-dim">{icone(l.rede)}</span>
                {l.rede}
              </span>
              <span className="truncate font-mono text-xs text-faint">{l.conta}</span>
              <span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${l.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-warn/30 bg-warn/10 text-warn"}`}>
                  <span aria-hidden>{l.ok ? "●" : "○"}</span>
                  {l.estado}
                </span>
              </span>
              <Link href={l.href} className="inline-flex min-h-9 items-center gap-1.5 justify-self-end rounded-md border border-line px-3 text-xs text-dim hover:text-ink">
                {l.acao}
                <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
