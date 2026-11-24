import { listPosts } from "@/server/posts";
import { listAllBrands, avatarOf } from "@/server/brands";
import { ApprovalQueue } from "@/components/approval-queue";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

// D11: fila de aprovacao propria, ordenada pelo horario de publicacao.
export default async function AprovacaoPage() {
  const [posts, brandsRaw] = await Promise.all([listPosts(), listAllBrands()]);
  const quando = (p: { scheduled_at: string | null; created_at: unknown }) =>
    new Date((p.scheduled_at ?? (p.created_at as string)) as string).getTime();
  const fila = posts
    .filter((p) => p.status === "draft")
    .sort((a, b) => quando(a) - quando(b));
  const brands = brandsRaw.map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
    avatar: avatarOf(b),
  }));

  return (
    <>
      <PageHeader title="Aprovação" subtitle={`${fila.length} ${fila.length === 1 ? "post" : "posts"} para decidir`} />
      {fila.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-10 text-center text-sm text-faint">
          Nada aguardando sua decisão.
        </p>
      ) : (
        <ApprovalQueue posts={fila} brands={brands} />
      )}
    </>
  );
}
