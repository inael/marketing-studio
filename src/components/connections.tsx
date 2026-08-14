"use client";

import { useState, type ReactNode } from "react";

type Props = { brandId: string; brandSlug: string; igConnected: boolean; linkedinConnected: boolean };

const L = (d: string) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
    <path d={d} />
  </svg>
);

const LOGOS: Record<string, ReactNode> = {
  instagram: L(
    "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.17.4.37 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2a3.9 3.9 0 0 1-.9 1.4c-.4.4-.8.7-1.4.9-.4.17-1 .37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.84-.4.4-.64.8-.84 1.3-.16.4-.35 1-.4 2.1C2.6 9.5 2.6 9.9 2.6 12s0 2.5.06 3.7c.05 1.1.24 1.7.4 2.1.2.5.44.9.84 1.3.4.4.8.64 1.3.84.4.16 1 .35 2.1.4 1.2.06 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.84.4-.4.64-.8.84-1.3.16-.4.35-1 .4-2.1.06-1.2.07-1.6.07-3.7s0-2.5-.06-3.7c-.05-1.1-.24-1.7-.4-2.1a3.5 3.5 0 0 0-.84-1.3 3.5 3.5 0 0 0-1.3-.84c-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5-3.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"
  ),
  linkedin: L(
    "M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3 0-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9V9Z"
  ),
  facebook: L(
    "M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3-.04-1.3-.12-2.47-.12-2.45 0-4.13 1.5-4.13 4.25v2.37H7.6V13h2.8v8h3.1Z"
  ),
  tiktok: L(
    "M16.5 3c.3 2 1.5 3.5 3.5 3.8v2.6c-1.3 0-2.5-.4-3.5-1v5.7a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.06v2.7a2.9 2.9 0 1 0 2 2.75V3h2.7Z"
  ),
  youtube: L(
    "M22 8.2s-.2-1.4-.8-2c-.77-.8-1.6-.8-2-.86C16.4 5 12 5 12 5s-4.4 0-7.2.34c-.4.06-1.23.06-2 .86-.6.6-.8 2-.8 2S2 9.8 2 11.4v1.2C2 14.2 2.2 15.8 2.2 15.8s.2 1.4.8 2c.77.8 1.8.77 2.25.86C6.85 18.9 12 19 12 19s4.4 0 7.2-.34c.4-.06 1.23-.06 2-.86.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.2C22.2 9.8 22 8.2 22 8.2ZM10 14.6V9.4l4.4 2.6L10 14.6Z"
  ),
  threads: L(
    "M12 3c4.5 0 7.5 2.8 7.5 8.9 0 6.2-3.2 8.6-7.4 8.6-2.7 0-4.7-1.2-5.7-3.3l1.9-1c.6 1.3 1.8 2.1 3.8 2.1 2.8 0 4.4-1.4 4.5-5.3-.7 1-2 1.7-3.7 1.7-2.6 0-4.4-1.5-4.4-3.8 0-2.2 1.9-3.8 4.4-3.8 1.7 0 3 .7 3.6 1.9-.2-2.4-1.5-3.7-3.9-3.7-1.6 0-2.7.6-3.4 1.7l-1.7-1.2C8.4 3.9 10 3 12 3Zm.4 6.1c-1.4 0-2.3.7-2.3 1.8 0 1 .9 1.7 2.2 1.7 1.6 0 2.6-.9 2.7-2.3-.6-.7-1.5-1.2-2.6-1.2Z"
  ),
  x: L("M17.5 3H21l-6.6 7.6L22 21h-6l-4.5-5.9L6 21H3l7-8.1L2.5 3H9l4.1 5.4L17.5 3Zm-1.1 16h1.7L7.7 4.9H6L16.4 19Z"),
  pinterest: L(
    "M12 2.5a9.5 9.5 0 0 0-3.5 18.3c-.05-.8-.1-2 .1-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.85 0 1.26.64 1.26 1.4 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.8 1.48 1.8 1.78 0 3-2.3 3-5 0-2.06-1.4-3.6-3.9-3.6a4.45 4.45 0 0 0-4.65 4.5c0 .82.24 1.4.62 1.85.17.2.2.3.14.53l-.2.83c-.07.27-.28.36-.52.26-1.44-.6-2.1-2.16-2.1-3.94 0-2.93 2.47-6.44 7.36-6.44 3.93 0 6.52 2.85 6.52 5.9 0 4.03-2.24 7.04-5.54 7.04-1.1 0-2.16-.6-2.5-1.28l-.7 2.75c-.24.9-.9 2.05-1.36 2.75A9.5 9.5 0 1 0 12 2.5Z"
  ),
};

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
                {LOGOS[n.key] ?? n.label[0]}
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
                ) : n.key === "instagram" || n.key === "linkedin" ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/connections/${n.key}/start?brand=${brandSlug}`}
                      className="rounded-md bg-ink px-3 py-1 text-xs font-medium text-canvas transition-opacity hover:opacity-90"
                    >
                      Conectar
                    </a>
                    <a href={anchor(n.key)} className="text-[11px] text-faint hover:text-dim">
                      ou colar token
                    </a>
                  </div>
                ) : (
                  <a
                    href={anchor(n.key)}
                    className="rounded-md bg-ink px-3 py-1 text-xs font-medium text-canvas transition-opacity hover:opacity-90"
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
