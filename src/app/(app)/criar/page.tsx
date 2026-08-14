import { listBrands } from "@/server/brands";
import { CreateForm } from "@/components/create-form";
import { PageHeader, Empty } from "@/components/ui";
import Link from "next/link";
import { btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CriarPage() {
  const brands = (await listBrands()).map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
  }));

  return (
    <>
      <PageHeader
        title="Criar post"
        subtitle="Monte o post e veja o preview. Salve como rascunho, agende ou publique agora."
      />
      {brands.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-panel p-4">
            <div className="text-sm font-medium text-ink">1. Manual</div>
            <p className="mt-1 text-xs text-dim">
              Escreva a legenda e suba a imagem você mesmo, no formulário abaixo.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <div className="text-sm font-medium text-ink">2. Com auxílio da IA</div>
            <p className="mt-1 text-xs text-dim">
              No formulário: <span className="text-info">✦ Gerar com IA</span> escreve a legenda e o
              campo <span className="text-info">Gerar imagem</span> cria a arte.
            </p>
          </div>
          <Link href="/sugestoes" className="rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line2">
            <div className="text-sm font-medium text-ink">3. Sugestões do time →</div>
            <p className="mt-1 text-xs text-dim">
              O time de agentes analisa notícias e concorrentes e propõe 6 posts. Você aceita e vira
              rascunho aqui.
            </p>
          </Link>
        </div>
      )}
      {brands.length === 0 ? (
        <Empty
          title="Nenhuma marca ativa"
          hint="Ative ao menos uma marca para criar posts."
          action={
            <Link href="/marcas" className={btnPrimary}>
              Ir para Marcas
            </Link>
          }
        />
      ) : (
        <CreateForm brands={brands} />
      )}
    </>
  );
}
