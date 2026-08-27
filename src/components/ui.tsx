import { STATUS, type StatusKey } from "@/lib/ui";

// Primitivas de apresentação reusadas pelas telas do console.

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-dim">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function BrandDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ background: color, width: size, height: size }}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as StatusKey] ?? STATUS.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${s.text}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-panel/40 px-6 py-16 text-center">
      <p className="text-sm text-dim">{title}</p>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Estado de uma integração/conta na tela de Config. */
export type ConnState = "ok" | "partial" | "off";

const CONN: Record<ConnState, { label: string; cls: string; icon: React.ReactNode }> = {
  ok: {
    label: "Conectado",
    cls: "border-ok/30 bg-ok/10 text-ok",
    icon: <path d="m3.5 8.5 3 3 6-6.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  partial: {
    label: "Incompleto",
    cls: "border-warn/30 bg-warn/10 text-warn",
    icon: <path d="M8 4.5v4.2M8 11.4v.1" strokeWidth="2" strokeLinecap="round" />,
  },
  off: {
    label: "Não configurado",
    cls: "border-line bg-panel2 text-faint",
    icon: <circle cx="8" cy="8" r="4.5" strokeWidth="1.6" strokeDasharray="2.5 2.5" />,
  },
};

/**
 * Selo de status de integração. Sempre ícone + texto (nunca só cor),
 * pra continuar legível em daltonismo e leitor de tela.
 */
export function ConnBadge({ state, label }: { state: ConnState; label?: string }) {
  const c = CONN[state];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${c.cls}`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5">
        {c.icon}
      </svg>
      {label ?? c.label}
    </span>
  );
}

/** Cabeçalho de seção da Config: título + selo de status alinhado à direita. */
export function SectionHead({
  title,
  hint,
  state,
  badgeLabel,
}: {
  title: string;
  hint?: React.ReactNode;
  state: ConnState;
  badgeLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
      </div>
      <ConnBadge state={state} label={badgeLabel} />
    </div>
  );
}

// classes reaproveitadas (mantém a chrome consistente)
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-dim transition-colors hover:border-line2 hover:text-ink";
export const inputCls =
  "w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line2";
export const labelCls = "block text-xs font-medium text-dim mb-1.5";
