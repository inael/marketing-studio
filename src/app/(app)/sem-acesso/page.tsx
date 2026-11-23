import Link from "next/link";
import { PageHeader, btnPrimary, btnGhost } from "@/components/ui";

export const dynamic = "force-dynamic";

// D50: tela de acesso negado. Diz o motivo e o caminho para resolver, sem beco sem saida.
const MOTIVOS: Record<
  string,
  { titulo: string; motivo: string; caminho: string; rotulo: string; href: string }
> = {
  papel: {
    titulo: "Esta área é só para gestão",
    motivo: "Seu papel é Analista. Configurações de marca, time e cofre ficam com a gestão.",
    caminho: "Peça a uma gestora ou gestor para fazer essa mudança. Enquanto isso, você pode criar e agendar posts normalmente.",
    rotulo: "Ir para Criar post",
    href: "/criar",
  },
  marca: {
    titulo: "Você não está nesta marca",
    motivo: "Analistas veem só as marcas em que a gestão colocou você.",
    caminho: "Peça para ser adicionado à marca na página Time. Ou troque de marca no topo da tela.",
    rotulo: "Ver o time",
    href: "/time",
  },
  cofre: {
    titulo: "Credenciais bloqueadas",
    motivo: "O cofre desta marca só mostra os valores para quem tem o papel de gestão.",
    caminho: "Peça para a gestão revelar o valor. Cada revelação fica registrada no histórico do cofre.",
    rotulo: "Abrir o cofre",
    href: "/marcas",
  },
};

const PADRAO = {
  titulo: "Você não tem acesso a esta tela",
  motivo: "Essa tela exige uma permissão que a sua conta não tem.",
  caminho: "Volte ao painel e siga pelo menu. Se o acesso era para estar liberado, fale com a gestão.",
  rotulo: "Voltar ao painel",
  href: "/dashboard",
};

export default async function SemAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  const m = (motivo && MOTIVOS[motivo]) || PADRAO;

  return (
    <>
      <PageHeader title="Sem acesso" subtitle="Nada foi alterado." />
      <section className="relative max-w-2xl overflow-hidden rounded-lg border border-line bg-panel p-6">
        <span className="absolute inset-y-0 left-0 w-1 bg-bad" />
        <h2 className="text-base font-semibold text-ink">{m.titulo}</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-faint">Motivo</dt>
            <dd className="mt-1 text-dim">{m.motivo}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-faint">Como resolver</dt>
            <dd className="mt-1 text-dim">{m.caminho}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={m.href} className={btnPrimary}>
            {m.rotulo}
          </Link>
          <Link href="/dashboard" className={btnGhost}>
            Voltar ao painel
          </Link>
        </div>
      </section>
    </>
  );
}
