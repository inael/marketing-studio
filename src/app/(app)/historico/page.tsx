import Link from "next/link";
import { listPosts } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { PageHeader, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

// M29: historico agrupado por dia, com filtro de resultado e o resultado em uma frase.
export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filtro = f === "publicadas" || f === "falhas" ? f : "todas";
  const [posts, brands] = await Promise.all([listPosts(), listAllBrands()]);
  const nome = new Map(brands.map((b) => [b.id, b.nome]));

  const saidas = posts
    .filter((p) => !p.deleted_at && (p.status === "published" || p.status === "failed"))
    .filter((p) => (filtro === "publicadas" ? p.status === "published" : filtro === "falhas" ? p.status === "failed" : true))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const porDia = new Map<string, typeof saidas>();
  for (const p of saidas) {
    const dia = new Date(p.updated_at).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
    porDia.set(dia, [...(porDia.get(dia) ?? []), p]);
  }

  const iconeChip = (v: string) =>
    v === "publicadas" ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4 4 10-10" /></svg>
    ) : v === "falhas" ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.9" strokeLinecap="round"><path d="M12 7.5v5.5M12 16.5h.01" /><circle cx="12" cy="12" r="8.5" /></svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.9" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
    );

  const chip = (v: string, label: string) => (
    <Link
      href={v === "todas" ? "/historico" : `/historico?f=${v}`}
      aria-current={filtro === v ? "page" : undefined}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors ${filtro === v ? "bg-panel2 text-ink shadow-sm" : "text-dim hover:text-ink"}`}
    >
      {iconeChip(v)}
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Histórico" subtitle="O que saiu e o que falhou" />
      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-line bg-panel p-1.5">
        {chip("todas", "Todas")}
        {chip("publicadas", "Publicadas")}
        {chip("falhas", "Falhas")}
      </div>

      {saidas.length === 0 ? (
        <Empty title="Nada publicado ainda" hint="Quando um post sair ou falhar, ele aparece aqui." />
      ) : (
        <div className="space-y-5">
          {[...porDia.entries()].map(([dia, lista]) => (
            <section key={dia}>
              <h2 className="mb-3 border-b border-line pb-2 text-xs font-bold uppercase tracking-[0.16em] text-faint">{dia}</h2>
              <ul className="space-y-2">
                {lista.map((p) => {
                  const hora = new Date(p.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const ok = p.status === "published";
                  return (
                    <li key={p.id} className="flex min-w-0 gap-3 rounded-xl border border-line bg-panel px-4 py-3">
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ok ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>
                        {ok ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4 4 10-10" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.9" strokeLinecap="round"><path d="M12 7.5v5.5M12 16.5h.01" /><circle cx="12" cy="12" r="8.5" /></svg>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-faint">
                        <span className="font-mono">{hora}</span>
                        <span>·</span>
                        <span>{nome.get(p.brand_id) ?? "marca"}</span>
                      </div>
                      <div className="mt-1 truncate text-sm text-ink">{p.legenda?.trim() || "post sem legenda"}</div>
                      <details className="mt-1 text-xs">
                        <summary className={`cursor-pointer ${ok ? "text-ok" : "text-bad"}`}>
                          {ok ? "Saiu sem erro." : `Não saiu${p.erro ? `: ${p.erro}` : ", motivo não registrado."}`}
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap break-words text-faint">{p.erro ?? "sem detalhes técnicos"}</pre>
                      </details>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
