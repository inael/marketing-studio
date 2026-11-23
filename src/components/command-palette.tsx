"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// D04: paleta de comandos (Ctrl/Cmd+K). Agrupa acoes e telas. Busca de posts fica para
// quando a lista de posts estiver disponivel no cliente.
export type PaletteItem = { href: string; label: string; group: "Ações" | "Telas"; hint?: string; key?: string };

const ACOES: PaletteItem[] = [
  { href: "/criar", label: "Criar post", group: "Ações", hint: "escolhe marca e formato", key: "N" },
  { href: "/lote", label: "Novo lote de posts", group: "Ações", hint: "agendamento em massa", key: "⇧N" },
  { href: "/marcas", label: "Trocar de marca", group: "Ações", hint: "ver todas as marcas" },
  { href: "/criar", label: "/criar post", group: "Ações", hint: "post em uma marca" },
  { href: "/criar?tipo=carousel", label: "/criar carrossel", group: "Ações", hint: "pula a escolha de formato" },
  { href: "/storyboard", label: "/criar reel", group: "Ações", hint: "abre o storyboard" },
];

export function CommandPalette({ telas }: { telas: PaletteItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const itens = useMemo(() => {
    const todos = [...ACOES, ...telas.map((t) => ({ ...t, group: "Telas" as const }))];
    const term = q.trim().toLowerCase();
    if (term.startsWith("/")) return todos.filter((i) => i.group === "Ações" && i.label.toLowerCase().startsWith(term));
    return term ? todos.filter((i) => i.label.toLowerCase().includes(term) || i.group.toLowerCase().includes(term)) : todos;
  }, [q, telas]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (e.key === "Escape") {
        setOpen(false);
        setQ("");
      }
    }
    function onBarra(e: Event) {
      const detail = (e as CustomEvent<{ q: string }>).detail;
      setQ(detail?.q ?? "");
      setIdx(0);
      setOpen(true);
    }
    function onEnter() {
      setIdx((i) => {
        const alvo = itensRef.current[i];
        if (alvo) {
          setOpen(false);
          setQ("");
          router.push(alvo.href);
        }
        return i;
      });
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("ms:palette", onBarra);
    window.addEventListener("ms:palette-enter", onEnter);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ms:palette", onBarra);
      window.removeEventListener("ms:palette-enter", onEnter);
    };
  }, [router]);

  useEffect(() => {
    if (open) {
      setIdx(0);
    }
  }, [open]);

  // referencia atual dos itens para a tecla Enter da barra do topo
  const itensRef = useRef<PaletteItem[]>([]);
  itensRef.current = itens;

  function go(item: PaletteItem | undefined) {
    if (!item) return;
    setOpen(false);
    setQ("");
    router.push(item.href);
  }

  if (!open) return null;

  // agrupa mantendo a ordem: Acoes primeiro, depois Telas
  const grupos = (["Ações", "Telas"] as const).map((g) => ({
    nome: g,
    itens: itens.filter((i) => i.group === g),
  }));
  const plano = grupos.flatMap((g) => g.itens);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Buscar ou executar"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="text-faint" aria-hidden>
            ⌕
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIdx((i) => Math.min(i + 1, plano.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(plano[idx]);
              }
            }}
            placeholder="Buscar ou executar…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-faint">Esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {plano.length === 0 && <p className="px-4 py-6 text-center text-xs text-faint">Nada encontrado.</p>}
          {grupos
            .filter((g) => g.itens.length > 0)
            .map((g) => (
              <div key={g.nome}>
                <div className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-faint">{g.nome}</div>
                {g.itens.map((it) => {
                  const pos = plano.indexOf(it);
                  const ativo = pos === idx;
                  return (
                    <button
                      key={it.href + it.label}
                      type="button"
                      onMouseEnter={() => setIdx(pos)}
                      onClick={() => go(it)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${
                        ativo ? "bg-panel2 text-ink" : "text-dim"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{it.label}</span>
                        {it.hint && <span className="block truncate text-[11px] text-faint">{it.hint}</span>}
                      </span>
                      {it.key && <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-faint">{it.key}</kbd>}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>

        <div className="flex gap-4 border-t border-line px-4 py-2 text-[10px] text-faint">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>⌘K abrir e fechar</span>
        </div>
      </div>
    </div>
  );
}
