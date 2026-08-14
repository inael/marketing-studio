"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <>
        <rect x="4" y="4" width="7" height="9" rx="1.5" strokeWidth="1.6" />
        <rect x="4" y="16" width="7" height="4" rx="1.5" strokeWidth="1.6" />
        <rect x="13" y="4" width="7" height="4" rx="1.5" strokeWidth="1.6" />
        <rect x="13" y="11" width="7" height="9" rx="1.5" strokeWidth="1.6" />
      </>
    ),
  },
  {
    href: "/posts",
    label: "Posts",
    icon: (
      <path d="M4 5h16M4 12h16M4 19h10" strokeWidth="1.6" strokeLinecap="round" />
    ),
  },
  {
    href: "/criar",
    label: "Criar",
    icon: (
      <path d="M12 5v14M5 12h14" strokeWidth="1.6" strokeLinecap="round" />
    ),
  },
  {
    href: "/storyboard",
    label: "Storyboard",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" strokeWidth="1.6" />
        <path
          d="M9 5v14M15 5v14M4 9.5h5M15 9.5h5M4 14.5h5M15 14.5h5"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    href: "/sugestoes",
    label: "Sugestões",
    icon: (
      <>
        <path d="M9.5 18h5M10.5 21h3" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M12 3a6 6 0 0 0-3.8 10.6c.6.5 1.3 1.2 1.3 2.4h5c0-1.2.7-1.9 1.3-2.4A6 6 0 0 0 12 3z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: (
      <>
        <path d="M4 20V4M4 20h16" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 16v-4M12 16V8M16 16v-6" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/time",
    label: "Time",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" strokeWidth="1.6" />
        <path d="M3.5 19c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M16 5.6a3 3 0 0 1 0 5.4M17 14.6c2.2.5 3.5 2 3.5 4.4" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/calendario",
    label: "Calendário",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" strokeWidth="1.6" />
        <path d="M4 9h16M8 3v4M16 3v4" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/biblioteca",
    label: "Biblioteca",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.6" />
        <circle cx="9" cy="9.5" r="1.4" strokeWidth="1.6" />
        <path d="M4.5 16l4-4 3.5 3.5L15 12l4.5 4.5" strokeWidth="1.6" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/marcas",
    label: "Marcas",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.5" strokeWidth="1.6" />
      </>
    ),
  },
  {
    href: "/config",
    label: "Config",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" strokeWidth="1.6" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1l1.9-1.1"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {ITEMS.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-panel2 text-ink"
                : "text-dim hover:text-ink hover:bg-panel2/60"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className={`h-[18px] w-[18px] ${active ? "text-ink" : "text-faint group-hover:text-dim"}`}
            >
              {it.icon}
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
