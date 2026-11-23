import Link from "next/link";
import { PageHeader, btnPrimary, btnGhost } from "@/components/ui";

export const dynamic = "force-dynamic";

// M50: primeiro uso em cinco passos. Um passo por vez, com barra de progresso e opcao de pular.
const PASSOS = [
  { t: "Cadastre sua marca", d: "Nome, cor e tom de voz. É o que a IA usa para escrever.", acao: "Abrir marcas", href: "/marcas" },
  { t: "Conecte o Instagram", d: "Entre com a conta do Facebook e vincule a página.", acao: "Conectar", href: "/marcas" },
  { t: "Escreva o primeiro post", d: "Comece com um tema da marca. Você revisa antes de agendar.", acao: "Criar post", href: "/criar" },
  { t: "Aprove o que vai ao ar", d: "Na fila de aprovação, cada post sai com um toque.", acao: "Ver aprovação", href: "/aprovacao" },
  { t: "Agende", d: "Escolha o horário da marca e deixe o resto com o calendário.", acao: "Abrir agenda", href: "/calendario" },
];

export default async function ComecarPage({ searchParams }: { searchParams: Promise<{ passo?: string }> }) {
  const { passo } = await searchParams;
  const atual = Math.min(PASSOS.length, Math.max(1, Number(passo) || 1));
  const p = PASSOS[atual - 1];
  const proximo = atual < PASSOS.length ? `/comecar?passo=${atual + 1}` : "/dashboard";

  return (
    <>
      <PageHeader title="Primeiro uso" subtitle={`Passo ${atual} de ${PASSOS.length}`} />
      <div className="mb-6 h-1.5 max-w-xl overflow-hidden rounded bg-panel2">
        <div className="h-full bg-info/70" style={{ width: `${(atual / PASSOS.length) * 100}%` }} />
      </div>
      <section className="max-w-xl rounded-lg border border-line bg-panel p-6">
        <h2 className="text-base font-semibold text-ink">{p.t}</h2>
        <p className="mt-2 text-sm text-dim">{p.d}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href={p.href} className={`${btnPrimary} min-h-12 justify-center`}>
            {p.acao}
          </Link>
          <Link href={proximo} className={`${btnGhost} min-h-12 justify-center`}>
            {atual < PASSOS.length ? "Continuar" : "Concluir"}
          </Link>
        </div>
        <div className="mt-4 flex justify-between text-xs text-faint">
          {atual > 1 ? <Link href={`/comecar?passo=${atual - 1}`} className="hover:text-dim">← Voltar</Link> : <span />}
          <Link href="/dashboard" className="hover:text-dim">Pular o roteiro</Link>
        </div>
      </section>
    </>
  );
}
