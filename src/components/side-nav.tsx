"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/ui";
import { Avatar } from "@/components/avatar";
import { CommandPalette, type PaletteItem } from "@/components/command-palette";
import { Atalhos } from "@/components/atalhos";
import { MobileNav } from "@/components/mobile-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { RetornoSessao } from "@/components/retorno-sessao";
import { BrandSwitcher, type MarcaOpcao } from "@/components/brand-switcher";
import type { ContagensMenu } from "@/server/menu-contagens";

type Item = { href: string; label: string; hint?: string };
type Section = { key: string; label: string; icon: ReactNode; items: Item[] };

type ItemMenu = { href: string; label: string; contagem?: keyof ContagensMenu; alerta?: boolean };
type GrupoMenu = { titulo: string; itens: ItemMenu[] };

// Menu lateral em dois grupos: o dia a dia no alto, a gestão embaixo. Contadores ao lado do item.
const GRUPOS: GrupoMenu[] = [
  { titulo: "Dia a dia", itens: [
    { href: "/dashboard", label: "Início" },
    { href: "/aprovacao", label: "Aprovação", contagem: "aprovacao", alerta: true },
    { href: "/historico", label: "Histórico", contagem: "falhas", alerta: true },
    { href: "/criar", label: "Criar" },
    { href: "/posts", label: "Posts" },
    { href: "/calendario", label: "Calendário" },
    { href: "/biblioteca", label: "Biblioteca" },
    { href: "/notificacoes", label: "Notificações", contagem: "notificacoes" },
  ] },
  { titulo: "Gestão", itens: [
    { href: "/marcas", label: "Marcas" },
    { href: "/contas", label: "Contas" },
    { href: "/time", label: "Time" },
    { href: "/relatorios", label: "Relatórios" },
    { href: "/consumo", label: "Consumo de IA" },
    { href: "/config", label: "Configurações" },
  ] },
];

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
    { href: "/serie", label: "Em série", hint: "vários posts com intervalo" },
    { href: "/posts", label: "Posts", hint: "gerar arte, aprovar e publicar" },
    { href: "/aprovacao", label: "Aprovação", hint: "decidir o que sai hoje" },
    { href: "/notificacoes", label: "Notificações", hint: "o que pede ação e o que aconteceu" },
    { href: "/busca", label: "Buscar", hint: "posts, marcas e mídia, agrupados" },
    { href: "/historico", label: "Histórico", hint: "o que saiu e o que falhou" },
    { href: "/lote", label: "Lote", hint: "distribuir rascunhos prontos no mês" },
    { href: "/calendario", label: "Calendário", hint: "o que já tem hora marcada" },
    { href: "/storyboard", label: "Storyboard", hint: "roteiro de reel" },
    { href: "/biblioteca", label: "Biblioteca", hint: "imagens já geradas" },
  ] },
  { key: "marcas", label: "Marcas", icon: I(<><circle cx="12" cy="12" r="8" strokeWidth="1.6" /><circle cx="12" cy="12" r="2.5" strokeWidth="1.6" /></>), items: [
      { href: "/contas", label: "Contas", hint: "estado de cada conta, por marca" },{ href: "/marcas", label: "Marcas" }] },
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
  marcas = [],
  marcaAtiva = null,
  contagens = { aprovacao: 0, falhas: 0, notificacoes: 0 },
  children,
}: {
  who: string;
  picture?: string;
  marcas?: MarcaOpcao[];
  marcaAtiva?: string | null;
  contagens?: ContagensMenu;
  children: ReactNode;
}) {
  const marcaSel = marcas.find((m) => m.slug === marcaAtiva) ?? null;
  const pathname = usePathname();
  const router = useRouter();
  const current = sectionOf(pathname);

  // Padrão: o painel segue a seção da rota — e não existe nas de destino único.
  // O clique no trilho é um override válido só enquanto a rota não muda, então
  // navegar já devolve o painel ao estado natural (sem efeito, sem flash).
  const auto = current && current.items.length > 1 ? current.key : null;
  const [override, setOverride] = useState<{ path: string; key: string | null } | null>(null);
  // M48: folha de saida com o que sai deste aparelho
  const [saindo, setSaindo] = useState(false);
  const openKey = override?.path === pathname ? override.key : auto;

  const panel = openKey ? SECTIONS.find((s) => s.key === openKey) : undefined;

  // D04: todas as telas para a paleta de comandos
  const telas: PaletteItem[] = SECTIONS.flatMap((s) =>
    s.items.map((it) => ({ href: it.href, label: it.label, group: "Telas" as const, hint: it.hint })),
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-panel md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <Link href="/dashboard" className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-xs font-bold text-canvas" title="Marketing Studio">
            MS
          </Link>
          <span className="text-sm font-semibold text-ink">Marketing Studio</span>
        </div>

        <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{g.titulo}</div>
              <ul className="space-y-0.5">
                {g.itens.map((it) => {
                  const on = pathname === it.href || pathname.startsWith(it.href + "/");
                  const n = it.contagem ? contagens[it.contagem] : 0;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        aria-current={on ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${on ? "bg-panel2 text-ink" : "text-dim hover:bg-panel2/60 hover:text-ink"}`}
                      >
                        {it.label}
                        {n > 0 && (
                          <span
                            aria-label={`${n} ${it.contagem === "aprovacao" ? "aguardando aprovação" : it.contagem === "falhas" ? "com falha" : "não lidas"}`}
                            className={`ml-auto rounded-full px-1.5 text-[10px] font-semibold leading-[18px] ${it.alerta ? "bg-warn/20 text-warn" : "bg-panel2 text-dim"}`}
                          >
                            {n}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* marca, conta, tema e saída no rodapé do menu */}
        <div className="flex flex-col gap-2 border-t border-line px-3 py-3">
          <BrandSwitcher marcas={marcas} atual={marcaSel?.slug ?? null} />
          <div className="flex items-center gap-2">
            {picture ? (
              <Avatar src={picture} nome={initials(who)} cor="#3a3a40" title={who} />
            ) : (
              <span title={who} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel2 text-[11px] font-semibold text-dim">
                {initials(who)}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-xs text-dim">{who}</span>
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setSaindo(true)}
              title="Sair"
              aria-label="Sair da conta"
              className="grid h-8 w-8 place-items-center rounded-md text-faint transition-colors hover:bg-panel2 hover:text-dim"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-[16px] w-[16px]">
                <path d="M15 17v1.5a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2V7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M10.5 12h9m0 0-2.7-2.7M19.5 12l-2.7 2.7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {saindo && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 md:items-center md:justify-center" onClick={() => setSaindo(false)}>
          <div className="w-full rounded-t-xl border-t border-line bg-canvas p-5 md:max-w-sm md:rounded-xl md:border" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-ink">Sair deste aparelho?</div>
            <ul className="mt-3 space-y-1 text-xs text-dim">
              <li>Conta: {who}</li>
              {marcas.map((m) => (
                <li key={m.slug}>Marca aberta: {m.nome}</li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-faint">Último acesso: agora</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setSaindo(false)} className="min-h-11 flex-1 rounded-md border border-line text-sm text-dim">Cancelar</button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/logto/sign-out" className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-ink text-sm font-medium text-canvas">Sair de tudo</a>
            </div>
          </div>
        </div>
      )}
      <OfflineBanner />
      <main className="pb-20 transition-[padding] duration-200 md:pb-0 md:pl-56">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
          {/* D05: faixa de destaque na cor da marca escolhida */}
          {marcaSel && <div className="mb-4 h-1 rounded-full" style={{ background: marcaSel.cor }} aria-hidden />}
          <RetornoSessao />
          {/* D05 + D04: seletor de marca global e atalho para a paleta de comandos */}
          <div className="mb-6 flex items-center gap-3">
            {/* D04: a propria barra aceita texto (busca) ou "/" (comandos) */}
            <div className="relative w-full md:max-w-md">
              <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint">
                <circle cx="9" cy="9" r="6" />
                <path d="m14 14 4 4" strokeLinecap="round" />
              </svg>
              <input
                aria-label="Buscar ou executar comandos"
                placeholder="Buscar ou digitar / para comandos"
              onFocus={(e) => window.dispatchEvent(new CustomEvent("ms:palette", { detail: { q: e.currentTarget.value } }))}
              onChange={(e) => window.dispatchEvent(new CustomEvent("ms:palette", { detail: { q: e.currentTarget.value } }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") window.dispatchEvent(new CustomEvent("ms:palette-enter"));
              }}
              className="w-full rounded-md border border-line bg-panel py-2 pl-9 pr-10 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-line2"
            />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-faint">/</kbd>
            </div>
          </div>
          {/* D03: sub-telas da secao como abas no topo; o trilho fica so com as secoes */}
          {current && current.items.length > 1 && (
            <nav aria-label="Abas da seção" className="mb-5 flex flex-wrap gap-1 border-b border-line">
              {current.items.map((it) => {
                const on = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${on ? "border-ink text-ink" : "border-transparent text-faint hover:text-dim"}`}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </nav>
          )}
          {children}
        </div>
      </main>
      <CommandPalette telas={telas} />
      <Atalhos />
      <MobileNav telas={telas} />
    </div>
  );
}
