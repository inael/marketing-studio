"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMarcaAtiva } from "@/server/marca-ativa";

// D05: seletor de marca global. A escolha vale para toda a navegacao (cookie).
export type MarcaOpcao = { slug: string; nome: string; cor: string };

export function BrandSwitcher({ marcas, atual }: { marcas: MarcaOpcao[]; atual: string | null }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const sel = marcas.find((m) => m.slug === atual) ?? null;

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function escolher(slug: string | null) {
    setAberto(false);
    startTransition(async () => {
      await setMarcaAtiva(slug);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        disabled={pendente}
        className="flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-ink transition-colors hover:border-line2 disabled:opacity-60"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: sel?.cor ?? "var(--faint)" }}
          aria-hidden
        />
        {sel ? sel.nome : "Todas as marcas"}
        <span aria-hidden className="text-faint">
          ▾
        </span>
      </button>

      {aberto && (
        <ul
          role="listbox"
          className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-xl border-t border-line bg-panel py-2 shadow-xl md:absolute md:bottom-auto md:left-0 md:inset-x-auto md:mt-1 md:w-56 md:max-h-none md:overflow-hidden md:rounded-md md:border md:py-1"
        >
          <li>
            <button
              type="button"
              onClick={() => escolher(null)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-panel2 ${
                !sel ? "text-ink" : "text-dim"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-faint" aria-hidden />
              Todas as marcas
            </button>
          </li>
          {marcas.map((m) => (
            <li key={m.slug}>
              <button
                type="button"
                onClick={() => escolher(m.slug)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-panel2 ${
                  sel?.slug === m.slug ? "text-ink" : "text-dim"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.cor }} aria-hidden />
                {m.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
