"use client";

import { useState } from "react";
import { btnGhost, inputCls } from "@/components/ui";

export function TwitterConnect() {
  const [status, setStatus] = useState<string | null>(null);
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function call(action: "login" | "code") {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/twitter/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, code: action === "code" ? code : undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "falhou");
      if (data.status === "needs_code" || data.needs_code) {
        setNeedCode(true);
        setStatus("aguardando o código enviado no seu email");
      } else if (data.status === "ok" || data.connected) {
        setNeedCode(false);
        setStatus("conectado ✓ (cookies salvos)");
      } else {
        setStatus(String(data.status ?? "resposta recebida"));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "falhou");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => call("login")} disabled={busy} className={btnGhost}>
          {busy ? "conectando…" : "Conectar / testar login"}
        </button>
        {status && <span className="text-xs text-dim">{status}</span>}
      </div>
      {needCode && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="código do email"
            className={`${inputCls} max-w-40`}
          />
          <button type="button" onClick={() => call("code")} disabled={busy || !code} className={btnGhost}>
            Confirmar código
          </button>
        </div>
      )}
      {err && <p className="text-xs text-bad">{err}</p>}
      <p className="text-[11px] leading-relaxed text-faint">
        Salve o usuário/senha acima primeiro. &ldquo;Conectar&rdquo; loga na VPS; o X manda um código no seu
        email, digite aqui. Depois disso os cookies ficam salvos e a senha não é mais usada.
      </p>
    </div>
  );
}
