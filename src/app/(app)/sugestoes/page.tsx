import Link from "next/link";
import { listBrands } from "@/server/brands";
import { Suggestions } from "@/components/suggestions";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SugestoesPage() {
  const brands = (await listBrands()).map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
  }));

  return (
    <>
      <PageHeader
        title="Sugestões"
        subtitle="A IA analisa notícias e concorrentes da marca e propõe posts originais."
      />
      {brands.length === 0 ? (
        <Empty
          title="Nenhuma marca ativa"
          hint="Ative uma marca para gerar sugestões."
          action={
            <Link href="/marcas" className={btnPrimary}>
              Ir para Marcas
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-6 text-xs text-faint">
            Cadastre os feeds RSS e os concorrentes de cada marca em{" "}
            <Link href="/marcas" className="text-info hover:underline">
              Marcas
            </Link>{" "}
            → Fontes de conteúdo. Sem fontes, a IA sugere com base no que a marca faz.
          </p>
          <Suggestions brands={brands} />
        </>
      )}
    </>
  );
}
