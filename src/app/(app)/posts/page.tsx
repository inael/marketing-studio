import Link from "next/link";
import { listPosts, postsAnalytics } from "@/server/posts";
import { listAllBrands, avatarOf } from "@/server/brands";
import { PostsView } from "@/components/posts-view";
import { PageHeader, Empty, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const [posts, brandsRaw, analytics] = await Promise.all([
    listPosts(),
    listAllBrands(),
    postsAnalytics(),
  ]);
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
          title="Nenhum post por aqui"
          hint="Crie o primeiro post ou aceite uma sugestão do time."
          action={
            <Link href="/criar" className={btnPrimary}>
              Criar post
            </Link>
          }
        />
      ) : (
        <PostsView posts={posts} brands={brands} analytics={analytics} />
      )}
    </>
  );
}
