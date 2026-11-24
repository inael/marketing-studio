"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Avisos de sucesso, erro e informação, no canto superior direito.
// Qualquer parte do app avisa com: avisar("ok" | "erro" | "info", "texto")
export type TipoAviso = "ok" | "erro" | "info";
type Aviso = { id: number; tipo: TipoAviso; texto: string };

export function avisar(tipo: TipoAviso, texto: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("ms:aviso", { detail: { tipo, texto } }));
}

const ESTILO: Record<TipoAviso, { borda: string; icone: string; cor: string }> = {
  ok: { borda: "border-ok/40", icone: "text-ok", cor: "bg-ok/15" },
  erro: { borda: "border-bad/50", icone: "text-bad", cor: "bg-bad/15" },
  info: { borda: "border-info/40", icone: "text-info", cor: "bg-info/15" },
};

const ICONE: Record<TipoAviso, React.ReactNode> = {
  ok: <path d="m6.5 12.5 3.5 3.5 7.5-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  erro: <><path d="M12 7.5v5.5M12 16.5h.01" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="8.5" strokeWidth="1.8" /></>,
  info: <><circle cx="12" cy="12" r="8.5" strokeWidth="1.8" /><path d="M12 11v5M12 8h.01" strokeWidth="2" strokeLinecap="round" /></>,
};

// ações de servidor que redirecionam mandam o resultado na URL: ?aviso=ok|erro&msg=texto
export function AvisoDaUrl() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const tipo = params.get("aviso");
    const texto = params.get("msg");
    if (!tipo || !texto) return;
    avisar(tipo === "erro" ? "erro" : "ok", texto);
    const limpa = new URLSearchParams(params.toString());
    limpa.delete("aviso");
    limpa.delete("msg");
    const qs = limpa.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, router, pathname]);
  return null;
}

export function Avisos() {
  const [lista, setLista] = useState<Aviso[]>([]);

  useEffect(() => {
    let seq = 0;
    function ouvir(e: Event) {
      const d = (e as CustomEvent<{ tipo: TipoAviso; texto: string }>).detail;
      const id = ++seq + Date.now();
      setLista((cur) => [...cur.slice(-3), { id, tipo: d.tipo, texto: d.texto }]);
      window.setTimeout(() => setLista((cur) => cur.filter((a) => a.id !== id)), d.tipo === "erro" ? 7000 : 4000);
    }
    window.addEventListener("ms:aviso", ouvir);
    return () => window.removeEventListener("ms:aviso", ouvir);
  }, []);

  if (lista.length === 0) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {lista.map((a) => {
        const e = ESTILO[a.tipo];
        return (
          <div
            key={a.id}
            role={a.tipo === "erro" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-panel px-4 py-3 shadow-2xl ${e.borda}`}
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${e.cor} ${e.icone}`} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">{ICONE[a.tipo]}</svg>
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-sm leading-snug text-ink">{a.texto}</p>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setLista((cur) => cur.filter((x) => x.id !== a.id))}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-faint hover:bg-panel2 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5">
                <path d="M6 6l12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
