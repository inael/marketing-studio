"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// M40: faixa no topo quando a conexao cai. Mostra que o texto fica no aparelho e, ao voltar
// a conexao, avisa se ha texto guardado esperando para ser enviado.
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const up = () => {
      const off = !navigator.onLine;
      setOffline(off);
      try {
        setGuardado(Boolean(localStorage.getItem("ms_rascunho_legenda")?.trim()));
      } catch {
        setGuardado(false);
      }
    };
    up();
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);

  if (offline) {
    return (
      <div role="status" className="fixed inset-x-0 top-0 z-50 bg-warn px-4 py-2 text-center text-xs font-medium text-black">
        Sem conexão. A tela continua aqui; o que você escrever fica no aparelho até a conexão voltar.
      </div>
    );
  }
  if (guardado) {
    return (
      <div role="status" className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 bg-info px-4 py-2 text-xs font-medium text-white">
        <span>Você tem texto guardado neste aparelho.</span>
        <Link href="/criar" className="underline">Continuar</Link>
      </div>
    );
  }
  return null;
}
