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

  const chip = (v: string, label: string) => (
    <Link
      href={v === "todas" ? "/historico" : `/historico?f=${v}`}
      aria-current={filtro === v ? "page" : undefined}
      className={`min-h-11 rounded-full border px-4 py-2 text-xs md:min-h-0 md:py-1 ${filtro === v ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Histórico" subtitle="O que saiu e o que falhou" />
      <div className="mb-5 flex flex-wrap gap-2">
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
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">{dia}</h2>
              <ul className="space-y-2">
                {lista.map((p) => {
                  const hora = new Date(p.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const ok = p.status === "published";
                  return (
                    <li key={p.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-faint">
                        <span>{hora} · {nome.get(p.brand_id) ?? "marca"}</span>
                      </div>
                      <div className="mt-1 truncate text-sm text-ink">{p.legenda?.trim() || "post sem legenda"}</div>
                      <details className="mt-1 text-xs">
                        <summary className={`cursor-pointer ${ok ? "text-ok" : "text-bad"}`}>
                          {ok ? "Saiu sem erro." : `Não saiu${p.erro ? `: ${p.erro}` : ", motivo não registrado."}`}
                        </summary>
                        <pre className="mt-1 whitespace-pre-wrap break-words text-faint">{p.erro ?? "sem detalhes técnicos"}</pre>
                      </details>
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
