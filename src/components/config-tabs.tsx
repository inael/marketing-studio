import Link from "next/link";

// D47: abas da tela de Configuracoes (Integracoes e Aparencia)
export function ConfigTabs({ atual }: { atual: "integracoes" | "aparencia" }) {
  const tab = (on: boolean) =>
    `rounded-md border px-3 py-1.5 text-xs transition-colors ${on ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"}`;
  return (
    <nav aria-label="Abas de configuração" className="mb-6 flex gap-2">
      <Link href="/config" className={tab(atual === "integracoes")} aria-current={atual === "integracoes" ? "page" : undefined}>
        Integrações
      </Link>
      <Link href="/config/aparencia" className={tab(atual === "aparencia")} aria-current={atual === "aparencia" ? "page" : undefined}>
        Aparência
      </Link>
    </nav>
  );
}
