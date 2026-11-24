"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { btnGhost } from "@/components/ui";

export type PendenciaItem = { key: string; titulo: string; detalhe: string; cor: string; acao: string; href: string };
export type FaixaPendencia = { key: string; titulo: string; cor: string; itens: PendenciaItem[] };

/**
 * "Precisa de você" em abas por gravidade (opção 2 do ajuste de conteúdo):
 * uma aba por faixa, com contagem, e os itens em grade de duas colunas.
 * A aba "Tudo" junta as faixas, mantendo a ordem de urgência.
 */
const ICONE = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

// ícone de cada aba: alerta (urgente), tomada (conexão), lápis (revisar), lista (tudo)
const ICONE_ABA: Record<string, ReactNode> = {
  falha: ICONE(<><path d="M12 4 2.8 19.5h18.4L12 4z" /><path d="M12 10v4M12 17.2h.01" /></>),
  conexao: ICONE(<><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7zM12 16v5" /></>),
  rascunho: ICONE(<><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></>),
  tudo: ICONE(<><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>),
};

// ícone de cada botão conforme o verbo da ação: conectar, revisar, ver ou corrigir
function iconeDaAcao(acao: string): ReactNode {
  const traco = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": true, className: "h-4 w-4" };
  if (/conect/i.test(acao)) {
    return (
      <svg {...traco} strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7zM12 16v5" />
      </svg>
    );
  }
  if (/revis|abrir|escrev/i.test(acao)) {
    return (
      <svg {...traco} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      </svg>
    );
  }
  return (
    <svg {...traco} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PendenciasAbas({ faixas }: { faixas: FaixaPendencia[] }) {
  const total = faixas.reduce((t, f) => t + f.itens.length, 0);
  const [aba, setAba] = useState<string>(faixas[0]?.key ?? "tudo");

  const itens =
    aba === "tudo"
      ? faixas.flatMap((f) => f.itens)
      : (faixas.find((f) => f.key === aba)?.itens ?? []);

  const abas = [
    ...faixas.map((f) => ({ key: f.key, rotulo: f.titulo, n: f.itens.length, cor: f.cor })),
    { key: "tudo", rotulo: "Tudo", n: total, cor: "text-dim" },
  ];

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Filtrar pendências por gravidade" className="flex flex-wrap gap-2 rounded-xl border border-line bg-panel p-1.5">
        {abas.map((a) => {
          const on = aba === a.key;
          return (
            <button
              key={a.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setAba(a.key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                on ? "bg-panel2 text-ink shadow-sm" : "text-faint hover:bg-panel2/60 hover:text-dim"
              }`}
            >
              <span className={on ? a.cor : "text-faint"} aria-hidden>
                {ICONE_ABA[a.key] ?? ICONE_ABA.tudo}
              </span>
              <span>{a.rotulo}</span>
              <span
                className={`ml-0.5 min-w-[22px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-[18px] ${
                  on ? a.cor.replace("text-", "bg-") + "/15 " + a.cor : "bg-panel2 text-dim"
                }`}
              >
                {a.n}
              </span>
            </button>
          );
        })}
      </div>

      <ul role="tabpanel" className="grid min-w-0 gap-3 sm:grid-cols-2">
        {itens.map((p) => (
          <li key={p.key} className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-panel p-4">
            <div className="min-w-0">
              <span className="line-clamp-2 text-sm text-ink">{p.titulo}</span>
              <span className={`mt-1 block truncate text-[11px] ${p.cor}`}>{p.detalhe}</span>
            </div>
            <Link href={p.href} className={`${btnGhost} mt-auto min-h-11 self-start px-4 md:min-h-0`}>
              {iconeDaAcao(p.acao)}
              {p.acao}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
