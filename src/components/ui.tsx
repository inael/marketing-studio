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

// classes reaproveitadas (mantém a chrome consistente)
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-dim transition-colors hover:border-line2 hover:text-ink";
export const inputCls =
  "w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line2";
export const labelCls = "block text-xs font-medium text-dim mb-1.5";
