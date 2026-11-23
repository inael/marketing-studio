import Link from "next/link";
import { listPosts, postsAnalytics } from "@/server/posts";
import { listAllBrands, avatarOf } from "@/server/brands";
import { PostsView } from "@/components/posts-view";
import { PageHeader, Empty, btnPrimary, btnGhost } from "@/components/ui";
import { getMarcaAtivaSlug } from "@/server/marca-ativa";

export const dynamic = "force-dynamic";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ analista?: string }> }) {
  const { analista } = await searchParams;
  const [posts, brandsRaw, analytics] = await Promise.all([
    listPosts(),
    listAllBrands(),
    postsAnalytics(),
  ]);
  // D05: marca ativa do seletor global vira o filtro inicial
  const slugAtiva = await getMarcaAtivaSlug();
  const marcaInicialId = brandsRaw.find((b) => b.slug === slugAtiva)?.id ?? null;
  const brands = brandsRaw.map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
    avatar: avatarOf(b),
  }));

  return (
    <>
      <PageHeader
        title="Posts"
        subtitle={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        action={
          <Link href="/criar" className={btnPrimary}>
            Criar post
          </Link>
        }
      />
      {posts.length === 0 ? (
        <Empty
          title="Seus posts aparecem aqui"
          hint="Crie o primeiro e ele entra na fila de revisão. Ou comece por uma marca."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/criar" className={`${btnPrimary} min-h-12 justify-center`}>
                Criar primeiro post
              </Link>
              <Link href="/marcas" className={`${btnGhost} min-h-12 justify-center`}>
                Começar por uma marca
              </Link>
            </div>
          }
        />
      ) : (
        <PostsView posts={posts} brands={brands} analytics={analytics} marcaInicialId={marcaInicialId} analistaInicial={analista} />
      )}
    </>
  );
}
