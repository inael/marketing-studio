"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/ui";

type Item = { href: string; label: string };
type Section = { key: string; label: string; icon: ReactNode; items: Item[] };

const I = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-[18px] w-[18px]">
    {d}
  </svg>
);

const SECTIONS: Section[] = [
  { key: "inicio", label: "Início", icon: I(<><rect x="4" y="4" width="7" height="9" rx="1.5" strokeWidth="1.6" /><rect x="4" y="16" width="7" height="4" rx="1.5" strokeWidth="1.6" /><rect x="13" y="4" width="7" height="4" rx="1.5" strokeWidth="1.6" /><rect x="13" y="11" width="7" height="9" rx="1.5" strokeWidth="1.6" /></>), items: [{ href: "/dashboard", label: "Dashboard" }] },
  { key: "conteudo", label: "Conteúdo", icon: I(<><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.6" /><path d="M4 9h16M9 9v11" strokeWidth="1.5" /></>), items: [
    { href: "/posts", label: "Posts" },
    { href: "/criar", label: "Criar" },
    { href: "/sugestoes", label: "Sugestões" },
    { href: "/storyboard", label: "Storyboard" },
    { href: "/calendario", label: "Calendário" },
    { href: "/biblioteca", label: "Biblioteca" },
  ] },
  { key: "marcas", label: "Marcas", icon: I(<><circle cx="12" cy="12" r="8" strokeWidth="1.6" /><circle cx="12" cy="12" r="2.5" strokeWidth="1.6" /></>), items: [{ href: "/marcas", label: "Marcas" }] },
  { key: "relatorios", label: "Relatórios", icon: I(<><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" strokeWidth="1.6" strokeLinecap="round" /></>), items: [
    { href: "/relatorios", label: "Concorrentes" },
    { href: "/consumo", label: "Consumo" },
  ] },
  { key: "time", label: "Time", icon: I(<><circle cx="9" cy="8" r="3" strokeWidth="1.6" /><path d="M3.5 19c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6M16 5.6a3 3 0 0 1 0 5.4M17 14.6c2.2.5 3.5 2 3.5 4.4" strokeWidth="1.6" strokeLinecap="round" /></>), items: [{ href: "/time", label: "Time" }] },
  { key: "config", label: "Config", icon: I(<><circle cx="12" cy="12" r="3" strokeWidth="1.6" /><path d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1l1.9-1.1" strokeWidth="1.6" strokeLinecap="round" /></>), items: [{ href: "/config", label: "Config" }] },
];

function sectionOf(pathname: string): string {
  for (const s of SECTIONS) if (s.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) return s.key;
  return "inicio";
}

export function SideNav({ who, picture }: { who: string; picture?: string }) {
  const pathname = usePathname();
  const current = sectionOf(pathname);
  const [open, setOpen] = useState(current);
  useEffect(() => setOpen(current), [current]);
  const section = SECTIONS.find((s) => s.key === open) ?? SECTIONS[0];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex">
      {/* rail */}
      <div className="flex w-16 flex-col items-center border-r border-line bg-panel py-3">
        <Link href="/dashboard" className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-ink text-xs font-bold text-canvas" title="Marketing Studio">
          MS
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-1 self-stretch px-1.5">
          {SECTIONS.map((s) => {
            const on = current === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setOpen(s.key)}
                title={s.label}
                className={`flex w-full flex-col items-center gap-0.5 rounded-md py-2 transition-colors ${
                  on ? "bg-panel2 text-ink" : "text-faint hover:text-dim"
                } ${open === s.key && !on ? "ring-1 ring-line2" : ""}`}
              >
                {s.icon}
                <span className="text-[9px] leading-none">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* submenu */}
      <div className="flex w-48 flex-col border-r border-line bg-panel">
        <div className="px-4 pb-2 pt-4 text-sm font-semibold text-ink">{section.label}</div>
        <nav className="flex-1 space-y-0.5 px-2">
          {section.items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-panel2 text-ink" : "text-dim hover:bg-panel2/60 hover:text-ink"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-2.5 px-1 py-1">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel2 text-[11px] font-semibold text-dim">
                {initials(who)}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-dim" title={who}>
              {who}
            </span>
          </div>
          <ThemeToggle />
          <a href="/logto/sign-out" className="mt-1 block rounded-md px-3 py-2 text-xs text-faint transition-colors hover:bg-panel2 hover:text-dim">
            Sair
          </a>
        </div>
      </div>
    </aside>
  );
}
