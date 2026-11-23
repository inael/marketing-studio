"use client";

import { useState } from "react";
import { btnGhost } from "@/components/ui";

// D24: teste de conexao depois de conectar. Confirma que a conta responde antes de publicar.
// O botao so fica ativo quando os 3 passos estao prontos (pronto = conta vinculada).
export function TesteConexao({ brandId, pronto }: { brandId: string; pronto: boolean }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; texto: string } | null>(null);

  async function testar() {
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/connections/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, network: "instagram" }),
      });
      const data = await r.json();
      setRes(
        r.ok
          ? { ok: true, texto: `Conta respondeu${data.username ? `: @${data.username}` : ""}. Pronta para publicar.` }
          : { ok: false, texto: data.error ?? "a conta não respondeu" },
      );
    } catch (e) {
      setRes({ ok: false, texto: e instanceof Error ? e.message : "falha no teste" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 max-w-2xl space-y-2">
      <button type="button" onClick={testar} disabled={!pronto || busy} className={btnGhost}>
        {busy ? "testando…" : "Testar conexão"}
      </button>
      {!pronto && <p className="text-[11px] text-faint">Libera quando os 3 passos estiverem prontos.</p>}
      {res && <p className={`text-xs ${res.ok ? "text-ok" : "text-bad"}`}>{res.texto}</p>}
    </div>
  );
}
