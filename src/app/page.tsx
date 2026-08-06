import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Entrada do produto: quem já está logado vai direto pro app; visitante vê
// uma porta de entrada limpa e branded (a landing completa é fase própria).
export default async function Home() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (isAuthenticated) redirect("/posts");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-neutral-950 text-neutral-100">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        IT Booster
      </p>
      <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
        Marketing Studio
      </h1>
      <p className="mt-4 max-w-md text-neutral-400 leading-relaxed">
        Orquestração de conteúdo social (Instagram e LinkedIn) dos produtos
        IT Booster: agendamento, geração e aprovação num lugar só.
      </p>
      <a
        href="/logto/sign-in"
        className="mt-8 inline-flex items-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
      >
        Entrar
      </a>
      <footer className="mt-16 text-xs text-neutral-600">
        Acesso restrito à equipe IT Booster
      </footer>
    </main>
  );
}
