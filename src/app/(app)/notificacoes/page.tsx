import Link from "next/link";
import { dashboardSummary } from "@/server/dashboard";
import { listPosts } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { listarNotificacoes } from "@/server/notificacoes";
import { PageHeader, Empty, btnGhost } from "@/components/ui";

export const dynamic = "force-dynamic";

// D44: central de notificacoes em duas abas. "Pedem ação" traz o que bloqueia algo;
// "Informativo" traz o que aconteceu sem exigir resposta.
export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const { aba } = await searchParams;
  const atual = aba === "info" ? "info" : "acao";
  const [dash, posts, brands, avisos] = await Promise.all([dashboardSummary(), listPosts(), listAllBrands(), listarNotificacoes()]);
  const nomeMarca = new Map(brands.map((b) => [b.id, b.nome]));

  // B39: avisos gerados pelo sistema entram primeiro (falhas do job); depois as pendencias do painel
  const pedemAcao = [
    ...avisos.filter((n) => n.tipo === "acao").map((n) => ({ key: `n-${n.id}`, titulo: n.titulo, detalhe: n.detalhe ?? "", acao: "Ver", href: n.href ?? "/posts" })),
    ...dash.pendencias,
  ];
  const informativo = posts
    .filter((p) => p.status === "published" && !p.deleted_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 20);

  const aba_ = (id: "acao" | "info", label: string, n: number) => (
    <Link
      href={`/notificacoes?aba=${id}`}
      aria-current={atual === id ? "page" : undefined}
      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
        atual === id ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
      }`}
    >
      {label} <span className="text-faint">{n}</span>
    </Link>
  );

  return (
    <>
      <PageHeader title="Notificações" subtitle="O que precisa de você e o que aconteceu" />
      <div className="mb-5 inline-flex gap-1 rounded-xl border border-line bg-panel p-1.5">
        {aba_("acao", "Pedem ação", pedemAcao.length)}
        {aba_("info", "Informativo", informativo.length)}
      </div>

      {atual === "acao" ? (
        pedemAcao.length === 0 ? (
          <Empty title="Nada pedindo ação" hint="Quando algo travar, aparece aqui com o botão para resolver." />
        ) : (
          <ul className="space-y-2">
            {pedemAcao.map((p) => (
              <li key={p.key} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bad/10 text-bad"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5h4" /></svg></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{p.titulo}</span>
                  <span className="block truncate text-xs text-dim">{p.detalhe}</span>
                </span>
                <Link href={p.href} className={`${btnGhost} gap-2`}>
                  {p.acao}
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : informativo.length === 0 ? (
        <Empty title="Nada publicado ainda" hint="As publicações aparecem aqui conforme saem." />
      ) : (
        <ul className="space-y-2">
          {informativo.map((p) => (
            <li key={p.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-panel2 text-dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5h4" /></svg></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 truncate text-sm text-ink">
                  {Date.now() - new Date(p.updated_at).getTime() < 86400000 && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-info" role="img" aria-label="novo" />
                  )}
                  Publicado: {p.legenda?.trim() ? p.legenda.slice(0, 80) : "post sem legenda"}
                </span>
                <span className="block truncate text-[11px] text-faint">
                  {nomeMarca.get(p.brand_id) ?? "marca"} · {new Date(p.updated_at).toLocaleString("pt-BR")}
                </span>
              </span>
              <Link href="/posts" className={btnGhost}>
                ver
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
