import Link from "next/link";
import { listBrands } from "@/server/brands";
import { Storyboard } from "@/components/storyboard";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StoryboardPage() {
  const brands = (await listBrands()).map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
  }));

  return (
    <>
      <PageHeader
        title="Storyboard"
        subtitle="Escreva a ideia, revise as cenas em imagem e só então gere o vídeo de cada uma."
      />
      {brands.length === 0 ? (
        <Empty
          title="Nenhuma marca ativa"
          hint="Ative uma marca para montar storyboards."
          action={
            <Link href="/marcas" className={btnPrimary}>
              Ir para Marcas
            </Link>
          }
        />
      ) : (
        <Storyboard brands={brands} />
      )}
    </>
  );
}
