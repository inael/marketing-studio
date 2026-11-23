"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// D48: painel de atalhos. A tecla "?" abre; cada acao mostra a dica ao lado e a tecla.
// N e Shift+N sao atalhos globais (ignorados quando o foco esta num campo de texto).
const LISTA: { acao: string; dica: string; tecla: string }[] = [
  { acao: "Abrir busca e ações", dica: "pesquisa telas e comandos", tecla: "⌘K / Ctrl K" },
  { acao: "Criar post", dica: "vai direto ao formulário", tecla: "N" },
  { acao: "Novo lote de posts", dica: "agendamento em massa", tecla: "⇧N" },
  { acao: "Aprovar item selecionado", dica: "na tela de Aprovação", tecla: "A" },
  { acao: "Navegar pela fila", dica: "na tela de Aprovação", tecla: "↑ ↓" },
  { acao: "Mostrar ou ocultar atalhos", dica: "este painel", tecla: "?" },
  { acao: "Fechar janelas", dica: "busca, painel ou detalhe", tecla: "Esc" },
];

function digitando(alvo: EventTarget | null) {
  const el = alvo as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function Atalhos() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") return setAberto(false);
      if (digitando(e.target)) return;
      if (e.key === "?") {
        e.preventDefault();
        setAberto((o) => !o);
      } else if (e.key === "N") {
        e.preventDefault();
        router.push("/lote");
      } else if (e.key === "n") {
        e.preventDefault();
        router.push("/criar");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setAberto(false)}>
      <div
        role="dialog"
        aria-label="Atalhos de teclado"
        className="w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Atalhos de teclado</h2>
          <button type="button" onClick={() => setAberto(false)} className="text-xs text-faint hover:text-ink">
            fechar
          </button>
        </div>
        <ul className="divide-y divide-line">
          {LISTA.map((l) => (
            <li key={l.acao} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block text-sm text-ink">{l.acao}</span>
                <span className="block text-[11px] text-faint">{l.dica}</span>
              </span>
              <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-dim">{l.tecla}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
