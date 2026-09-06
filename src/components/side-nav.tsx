"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/ui";
import { Avatar } from "@/components/avatar";

type Item = { href: string; label: string; hint?: string };
type Section = { key: string; label: string; icon: ReactNode; items: Item[] };

const I = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-[18px] w-[18px]">
    {d}
  </svg>
);

const SECTIONS: Section[] = [
  { key: "inicio", label: "Início", icon: I(<><rect x="4" y="4" width="7" height="9" rx="1.5" strokeWidth="1.6" /><rect x="4" y="16" width="7" height="4" rx="1.5" strokeWidth="1.6" /><rect x="13" y="4" width="7" height="4" rx="1.5" strokeWidth="1.6" /><rect x="13" y="11" width="7" height="9" rx="1.5" strokeWidth="1.6" /></>), items: [{ href: "/dashboard", label: "Dashboard" }] },
  // Ordem do submenu = ordem do trabalho: de onde a ideia nasce até ela ir ao ar.
  // As três primeiras são o caminho de uma publicação; as três últimas são apoio.
  { key: "conteudo", label: "Conteúdo", icon: I(<><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.6" /><path d="M4 9h16M9 9v11" strokeWidth="1.5" /></>), items: [
    { href: "/sugestoes", label: "Sugestões", hint: "ideias da IA — vire rascunho" },
    { href: "/criar", label: "Criar", hint: "post novo, do zero" },
    { href: "/posts", label: "Posts", hint: "gerar arte, aprovar e publicar" },
    { href: "/calendario", label: "Calendário", hint: "o que já tem hora marcada" },
    { href: "/storyboard", label: "Storyboard", hint: "roteiro de reel" },
    { href: "/biblioteca", label: "Biblioteca", hint: "imagens já geradas" },
  ] },
  { key: "marcas", label: "Marcas", icon: I(<><circle cx="12" cy="12" r="8" strokeWidth="1.6" /><circle cx="12" cy="12" r="2.5" strokeWidth="1.6" /></>), items: [{ href: "/marcas", label: "Marcas" }] },
  { key: "relatorios", label: "Relatórios", icon: I(<><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" strokeWidth="1.6" strokeLinecap="round" /></>), items: [
    { href: "/relatorios", label: "Concorrentes" },
    { href: "/consumo", label: "Consumo" },
  ] },
  { key: "time", label: "Time", icon: I(<><circle cx="9" cy="8" r="3" strokeWidth="1.6" /><path d="M3.5 19c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6M16 5.6a3 3 0 0 1 0 5.4M17 14.6c2.2.5 3.5 2 3.5 4.4" strokeWidth="1.6" strokeLinecap="round" /></>), items: [{ href: "/time", label: "Time" }] },
  { key: "config", label: "Config", icon: I(<><circle cx="12" cy="12" r="3" strokeWidth="1.6" /><path d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1l1.9-1.1" strokeWidth="1.6" strokeLinecap="round" /></>), items: [{ href: "/config", label: "Config" }] },
];

function sectionOf(pathname: string): Section | undefined {
  return SECTIONS.find((s) =>
    s.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))
  );
}

const railBtn =
  "flex w-full flex-col items-center gap-0.5 rounded-md py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line2";

/**
 * Casca do app: trilho de ícones + painel de submenu.
 *
 * O painel só existe pra seção que tem mais de um destino — seção de destino
 * único (Dashboard, Marcas, Time, Config) navega direto pelo trilho, em vez de
 * abrir um submenu com um item só repetindo o nome da seção.
 */
export function AppShell({
  who,
  picture,
  children,
}: {
  who: string;
  picture?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const current = sectionOf(pathname);

  // Padrão: o painel segue a seção da rota — e não existe nas de destino único.
  // O clique no trilho é um override válido só enquanto a rota não muda, então
  // navegar já devolve o painel ao estado natural (sem efeito, sem flash).
  const auto = current && current.items.length > 1 ? current.key : null;
  const [override, setOverride] = useState<{ path: string; key: string | null } | null>(null);
  const openKey = override?.path === pathname ? override.key : auto;

  const panel = openKey ? SECTIONS.find((s) => s.key === openKey) : undefined;

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex">
        {/* trilho */}
        <div className="flex w-16 flex-col items-center border-r border-line bg-panel py-3">
          <Link
            href="/dashboard"
            className="mb-3 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-ink text-xs font-bold text-canvas"
            title="Marketing Studio"
          >
            MS
          </Link>

          <nav aria-label="Seções" className="flex flex-1 flex-col items-center gap-1 self-stretch px-1.5">
            {SECTIONS.map((s) => {
              const on = current?.key === s.key;
              const tone = on ? "bg-panel2 text-ink" : "text-faint hover:bg-panel2/60 hover:text-dim";

              // destino único: navega direto, sem abrir painel
              if (s.items.length === 1) {
                return (
                  <Link
                    key={s.key}
                    href={s.items[0].href}
                    aria-current={on ? "page" : undefined}
                    className={`${railBtn} ${tone}`}
                  >
                    {s.icon}
                    <span className="text-[9px] leading-none">{s.label}</span>
                  </Link>
                );
              }

              const expanded = openKey === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setOverride({ path: pathname, key: expanded ? null : s.key })}
                  aria-expanded={expanded}
                  aria-controls="submenu"
                  className={`${railBtn} ${tone} ${expanded && !on ? "ring-1 ring-line2" : ""}`}
                >
                  {s.icon}
                  <span className="text-[9px] leading-none">{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* conta / tema / sair — separados do menu por uma borda */}
          <div className="mt-2 flex w-full flex-col items-center gap-1 border-t border-line px-1.5 pt-2">
            {picture ? (
              <Avatar src={picture} nome={initials(who)} cor="#3a3a40" title={who} />
            ) : (
              <span
                title={who}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel2 text-[11px] font-semibold text-dim"
              >
                {initials(who)}
              </span>
            )}
            <ThemeToggle compact />
            {/* handler de auth do Logto: precisa de navegação real, não client-side */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/logto/sign-out"
              title="Sair"
              aria-label="Sair da conta"
              className="grid h-9 w-9 place-items-center rounded-md text-faint transition-colors hover:bg-panel2 hover:text-dim"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-[18px] w-[18px]">
                <path d="M15 17v1.5a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2V7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M10.5 12h9m0 0-2.7-2.7M19.5 12l-2.7 2.7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* painel de submenu (só pras seções com mais de um destino) */}
        {panel && (
          <div id="submenu" className="flex w-56 flex-col border-r border-line bg-panel">
            <div className="px-4 pb-2 pt-4 text-sm font-semibold text-ink">{panel.label}</div>
            <nav aria-label={panel.label} className="flex-1 space-y-0.5 px-2 pb-3">
              {panel.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 transition-colors ${
                      active ? "bg-panel2 text-ink" : "text-dim hover:bg-panel2/60 hover:text-ink"
                    }`}
                  >
                    <span className="block text-sm leading-tight">{it.label}</span>
                    {it.hint && (
                      <span className="mt-0.5 block text-[10px] leading-snug text-faint">{it.hint}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </aside>

      <main className={`transition-[padding] duration-200 ${panel ? "pl-72" : "pl-16"}`}>
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
