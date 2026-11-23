"use client";

import { useEffect, useState } from "react";

// B02: depois do login, avisa que a sessao foi renovada e que a tela voltou com o texto.
export function RetornoSessao() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("ms_retorno")) {
        sessionStorage.removeItem("ms_retorno");
        setVisivel(true);
        const t = setTimeout(() => setVisivel(false), 6000);
        return () => clearTimeout(t);
      }
    } catch {
      // sem sessionStorage
    }
  }, []);
  if (!visivel) return null;
  return (
    <div role="status" className="mb-4 rounded-md border border-ok/40 bg-ok/5 px-3 py-2 text-xs text-ok">
      Sessão renovada. Você voltou para a mesma tela, com o texto que estava escrevendo.
    </div>
  );
}
