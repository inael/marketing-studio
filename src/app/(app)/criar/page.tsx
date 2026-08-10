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
