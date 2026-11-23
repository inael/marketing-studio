import { btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

// M32: entrada com um botao grande. Se a sessao expirou, explica e preserva o rascunho do aparelho.
export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ expirou?: string; voltar?: string }> }) {
  const { expirou, voltar } = await searchParams;
  const destino = voltar && voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/dashboard";
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-lg font-semibold text-ink">Marketing Studio</h1>
        {expirou ? (
          <p className="mt-2 text-sm text-dim">Sua sessão expirou. O que você estava escrevendo foi salvo neste aparelho.</p>
        ) : (
          <p className="mt-2 text-sm text-dim">Entre com o login do time para continuar.</p>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href={`/logto/sign-in?voltar=${encodeURIComponent(destino)}`} className={`${btnPrimary} min-h-14 justify-center text-base`}>
        Entrar com o login do time
      </a>
    </main>
  );
}
