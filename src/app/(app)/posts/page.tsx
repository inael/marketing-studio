import { listPosts } from "@/server/posts";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { redirect } from "next/navigation";
import { approvePost, publishPostAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");

  const posts = await listPosts();

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <ul className="space-y-3">
        {posts.map((p) => (
          <li
            key={p.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">
                {p.legenda.slice(0, 60) || "(sem legenda)"}
              </div>
              <div className="text-sm text-neutral-500">
                {p.tipo} · {p.status} · {p.media.length} mídia(s)
              </div>
            </div>
            <div className="flex gap-2">
              {p.status === "draft" && (
                <form action={approvePost.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-emerald-600 text-white"
                  >
                    Aprovar
                  </button>
                </form>
              )}
              {p.status === "approved" && (
                <form action={publishPostAction.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    Publicar
                  </button>
                </form>
              )}
              {p.external_url && (
                <a
                  className="px-3 py-1 rounded border"
                  href={p.external_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  ver post
                </a>
              )}
            </div>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="text-neutral-500">Nenhum post ainda.</li>
        )}
      </ul>
    </main>
  );
}
