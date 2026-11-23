"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// M01: navegacao do celular. Barra inferior com as 4 telas principais e "Mais" para o resto.
type Item = { href: string; label: string };

const PRINCIPAIS: Item[] = [
  { href: "/dashboard", label: "Início" },
  { href: "/posts", label: "Posts" },
  { href: "/criar", label: "Criar" },
  { href: "/calendario", label: "Agenda" },
];

export function MobileNav({ telas }: { telas: Item[] }) {
  const pathname = usePathname();
  const [mais, setMais] = useState(false);

  return (
    <>
      {mais && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMais(false)}>
          <div
            className="absolute inset-x-0 bottom-16 max-h-[70vh] overflow-y-auto rounded-t-xl border-t border-line bg-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 text-sm font-semibold text-ink">Todas as telas</div>
            <ul className="space-y-1">
              {telas.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    onClick={() => setMais(false)}
                    className="block rounded-md px-3 py-3 text-sm text-dim hover:bg-panel2 hover:text-ink"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-panel md:hidden"
      >
        {PRINCIPAIS.map((it) => {
          const on = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-12 items-center justify-center py-3 text-[12px] ${on ? "font-medium text-ink" : "text-faint"}`}
            >
              {it.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMais((o) => !o)}
          aria-expanded={mais}
          className="flex min-h-12 items-center justify-center py-3 text-[12px] text-faint"
        >
          Mais
        </button>
      </nav>
    </>
  );
}
