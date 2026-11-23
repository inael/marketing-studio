import { listAllBrands } from "@/server/brands";
import { listPosts } from "@/server/posts";
import { PageHeader } from "@/components/ui";
import { SerieForm } from "./serie-form";

export const dynamic = "force-dynamic";

// D15: agendar em serie com intervalo. Escolhe a marca e os rascunhos; o ritmo distribui as datas.
export default async function SeriePage() {
  const [marcas, posts] = await Promise.all([listAllBrands(), listPosts()]);
  const rascunhos = posts
    .filter((p) => !p.deleted_at && p.status === "draft" && p.media.length > 0 && !p.scheduled_at)
    .map((p) => ({ id: p.id, brand_id: p.brand_id, legenda: p.legenda, tipo: p.tipo }));
  return (
    <>
      <PageHeader title="Agendar em série" subtitle="Escolha a marca, os rascunhos e o ritmo. Confira as datas antes de confirmar." />
      <SerieForm
        marcas={marcas.map((m) => ({ id: m.id, nome: m.nome, cor: m.cor_principal }))}
        rascunhos={rascunhos}
      />
    </>
  );
}
