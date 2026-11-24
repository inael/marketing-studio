"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMarcaAtiva } from "@/server/marca-ativa";
import { Avatar } from "@/components/avatar";
import { avisar } from "@/components/avisos";

// D05: seletor de marca global. A escolha vale para toda a navegação (cookie).
export type MarcaOpcao = { slug: string; nome: string; cor: string; avatar?: string | null };

/**
 * Gaveta de marcas: o gatilho abre um painel lateral que sai da borda do menu
 * (no celular, a mesma gaveta ocupa a tela toda). Cada marca mostra o logo
 * (ou a inicial na cor da marca quando não há logo).
 */
export function BrandSwitcher({ marcas, atual }: { marcas: MarcaOpcao[]; atual: string | null }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();
  const sel = marcas.find((m) => m.slug === atual) ?? null;

  useEffect(() => {
    if (!aberto) return;
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  function escolher(slug: string | null) {
    setAberto(false);
    const nome = slug ? marcas.find((m) => m.slug === slug)?.nome ?? slug : "todas as marcas";
    startTransition(async () => {
      try {
        await setMarcaAtiva(slug);
        avisar("ok", `Painel mostrando ${nome}.`);
        router.refresh();
      } catch {
        avisar("erro", "Não foi possível trocar a marca. Tente de novo.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        disabled={pendente}
        className="flex w-full items-center gap-2.5 rounded-md border border-line bg-panel px-2.5 py-2 text-left text-sm text-ink transition-colors hover:border-line2 disabled:opacity-60"
      >
        {sel ? (
          <Avatar src={sel.avatar} nome={sel.nome} cor={sel.cor} size={24} />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-panel2 text-[10px] text-faint" aria-hidden>
            ∗
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{sel ? sel.nome : "Todas as marcas"}</span>
        <span aria-hidden className="text-faint">▸</span>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Escolher marca">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-line bg-panel shadow-2xl animate-[gaveta-entra_.25s_ease-out] md:w-[380px]">
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-canvas">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16M4 12h10M4 17h7" />
                  </svg>
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold leading-tight text-ink">Marcas</h2>
                  <p className="mt-0.5 text-xs text-dim">a marca escolhida vale no painel inteiro</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-dim transition-colors hover:bg-panel2 hover:text-ink"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4">
                  <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </header>
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-faint">{marcas.length} marcas</span>
              <span className="text-[11px] text-faint">{sel ? `ativa: ${sel.nome}` : "todas visíveis"}</span>
            </div>
            <ul className="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
              <li>
                <button
                  type="button"
                  onClick={() => escolher(null)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                    !sel ? "border-warn bg-panel2" : "border-line bg-panel hover:border-line2 hover:bg-panel2"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-dashed border-line2 text-faint" aria-hidden>∗</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-semibold text-ink">Todas as marcas</span>
                    <span className="block text-xs text-faint">o painel mostra tudo junto</span>
                  </span>
                  {!sel && <span className="rounded-full bg-warn px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-canvas">ativo</span>}
                </button>
              </li>
              {marcas.map((m) => {
                const ativa = sel?.slug === m.slug;
                return (
                  <li key={m.slug}>
                    <button
                      type="button"
                      onClick={() => escolher(m.slug)}
                      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-colors ${
                        ativa ? "border-warn bg-panel2" : "border-line bg-panel hover:border-line2 hover:bg-panel2"
                      }`}
                    >
                      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: m.cor }} />
                      <Avatar src={m.avatar} nome={m.nome} cor={m.cor} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-semibold text-ink">{m.nome}</span>
                        <span className="block text-xs text-faint">{ativa ? "marca ativa no painel" : "toque para trocar"}</span>
                      </span>
                      {ativa && <span className="rounded-full bg-warn px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-canvas">ativa</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-line px-6 py-4 text-xs text-faint">
              Você pode trocar a marca a qualquer momento pelo rodapé do menu.
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
