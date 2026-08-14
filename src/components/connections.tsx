"use client";

import { useState } from "react";

type Props = { brandId: string; brandSlug: string; igConnected: boolean; linkedinConnected: boolean };

const NETWORKS: { key: string; label: string; color: string; soon?: boolean }[] = [
  { key: "instagram", label: "Instagram", color: "#E1306C" },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { key: "facebook", label: "Facebook", color: "#1877F2", soon: true },
  { key: "tiktok", label: "TikTok", color: "#a1a1aa", soon: true },
  { key: "youtube", label: "YouTube", color: "#FF0000", soon: true },
  { key: "threads", label: "Threads", color: "#a1a1aa", soon: true },
  { key: "x", label: "X", color: "#a1a1aa", soon: true },
  { key: "pinterest", label: "Pinterest", color: "#E60023", soon: true },
];

type IgResult = { username?: string; picture?: string; error?: string };

export function Connections({ brandId, brandSlug, igConnected, linkedinConnected }: Props) {
  const [ig, setIg] = useState<IgResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function verifyIg() {
    setVerifying(true);
    setIg(null);
    try {
      const r = await fetch("/api/connections/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, network: "instagram" }),
      });
      const data = await r.json();
      setIg(r.ok ? { username: data.username, picture: data.picture } : { error: data.error ?? "falhou" });
    } catch (e) {
      setIg({ error: e instanceof Error ? e.message : "falhou" });
    } finally {
      setVerifying(false);
    }
  }

  const isOn = (key: string) =>
    key === "instagram" ? igConnected : key === "linkedin" ? linkedinConnected : false;
  const anchor = (key: string) =>
    key === "instagram" ? "#ig-fields" : key === "linkedin" ? "#linkedin-fields" : "#";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {NETWORKS.map((n) => {
        const on = isOn(n.key);
        return (
          <div key={n.key} className="rounded-lg border border-line bg-panel p-4">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
                style={{ background: n.color }}
              >
                {n.label[0]}
              </span>
              <div className="min-w-0">
                <div className="text-sm text-ink">{n.label}</div>
                <div className="text-xs">
                  {n.soon ? (
                    <span className="text-faint">em breve</span>
                  ) : on ? (
                    <span className="text-ok">conectado</span>
                  ) : (
                    <span className="text-faint">não conectado</span>
                  )}
                </div>
              </div>
            </div>

            {!n.soon && (
              <div className="mt-3 flex items-center gap-2">
                {on ? (
                  n.key === "instagram" ? (
                    <button
                      type="button"
                      onClick={verifyIg}
                      disabled={verifying}
                      className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-ink disabled:opacity-50"
                    >
                      {verifying ? "verificando…" : "Verificar"}
                    </button>
                  ) : (
                    <span className="text-xs text-faint">pronto para publicar</span>
                  )
                ) : n.key === "instagram" ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/connections/instagram/start?brand=${brandSlug}`}
                      className="rounded-md bg-ink px-3 py-1 text-xs font-medium text-canvas transition-colors hover:bg-white"
                    >
                      Conectar
                    </a>
                    <a href="#ig-fields" className="text-[11px] text-faint hover:text-dim">
                      ou colar token
                    </a>
                  </div>
                ) : (
                  <a
                    href={anchor(n.key)}
                    className="rounded-md bg-ink px-3 py-1 text-xs font-medium text-canvas transition-colors hover:bg-white"
                  >
                    Conectar
                  </a>
                )}
              </div>
            )}

            {n.key === "instagram" && ig && (
              <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                {ig.error ? (
                  <span className="text-xs text-bad">{ig.error}</span>
                ) : (
                  <>
                    {ig.picture && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ig.picture}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs text-ok">@{ig.username}</span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
