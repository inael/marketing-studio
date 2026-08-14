import Link from "next/link";
import { listBrands } from "@/server/brands";
import { listSuggestions } from "@/server/suggestions";
import { listAnalysts } from "@/server/personas";
import { Suggestions } from "@/components/suggestions";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SugestoesPage() {
  const [brandsRaw, initial, analysts] = await Promise.all([
    listBrands(),
    listSuggestions(),
    listAnalysts(),
  ]);
  const brands = brandsRaw.map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
  }));

  return (
    <>
      <PageHeader
        title="Sugestões"
        subtitle="O time analisa notícias e concorrentes da marca e propõe posts. As sugestões ficam salvas aqui até você aceitar ou apagar."
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
        <Suggestions brands={brands} initial={initial} analystNames={analysts.map((a) => a.nome)} />
      )}
    </>
  );
}
