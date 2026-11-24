"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/ui";
import { Avatar } from "@/components/avatar";
type PaletteItem = { href: string; label: string; group: "Telas"; hint?: string };
import { Atalhos } from "@/components/atalhos";
import { MobileNav } from "@/components/mobile-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { Avisos, AvisoDaUrl } from "@/components/avisos";
import { RetornoSessao } from "@/components/retorno-sessao";
import { BrandSwitcher, type MarcaOpcao } from "@/components/brand-switcher";
import type { ContagensMenu } from "@/server/menu-contagens";

type Item = { href: string; label: string; hint?: string };
type Section = { key: string; label: string; icon: ReactNode; items: Item[] };

type ItemMenu = { href: string; label: string; desc: string; icone: string; contagem?: keyof ContagensMenu; alerta?: boolean };
type GrupoMenu = { titulo: string; itens: ItemMenu[] };

const I = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-[18px] w-[18px]">
    {d}
  </svg>
);

// Ícones do menu (traço, 24px). Cada item tem ícone e uma descrição curta.
const ICONES: Record<string, ReactNode> = {
  home: I(<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1z" strokeWidth="1.6" strokeLinejoin="round" />),
  aprovar: I(<><circle cx="12" cy="12" r="8.5" strokeWidth="1.6" /><path d="m8.5 12.2 2.4 2.4 4.6-5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></>),
  historico: I(<><circle cx="12" cy="12" r="8.5" strokeWidth="1.6" /><path d="M12 7.5V12l3 2" strokeWidth="1.6" strokeLinecap="round" /></>),
  criar: I(<><circle cx="12" cy="12" r="8.5" strokeWidth="1.6" /><path d="M12 8v8M8 12h8" strokeWidth="1.6" strokeLinecap="round" /></>),
  posts: I(<><rect x="4" y="4" width="16" height="16" rx="2.5" strokeWidth="1.6" /><path d="M4 9.5h16" strokeWidth="1.6" /></>),
  calendario: I(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" strokeWidth="1.6" /><path d="M3.5 10h17M8 3v4M16 3v4" strokeWidth="1.6" strokeLinecap="round" /></>),
  biblioteca: I(<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" strokeWidth="1.6" /><circle cx="9" cy="10" r="1.8" strokeWidth="1.6" /><path d="m20.5 16-5-5-7.5 7.5" strokeWidth="1.6" strokeLinejoin="round" /></>),
  notificacoes: I(<><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" strokeWidth="1.6" strokeLinejoin="round" /><path d="M10 20.5h4" strokeWidth="1.6" strokeLinecap="round" /></>),
  marcas: I(<><circle cx="12" cy="12" r="8.5" strokeWidth="1.6" /><circle cx="12" cy="12" r="3" strokeWidth="1.6" /></>),
  contas: I(<><path d="M10 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1 1" strokeWidth="1.6" strokeLinecap="round" /><path d="M14 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1-1" strokeWidth="1.6" strokeLinecap="round" /></>),
  time: I(<><circle cx="9" cy="8" r="3.2" strokeWidth="1.6" /><path d="M3 20a6 6 0 0 1 12 0M16 4.8a3.2 3.2 0 0 1 0 6.4M18 14.4A6 6 0 0 1 21 20" strokeWidth="1.6" strokeLinecap="round" /></>),
  relatorios: I(<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" strokeWidth="1.6" strokeLinecap="round" />),
  consumo: I(<><rect x="6.5" y="6.5" width="11" height="11" rx="2" strokeWidth="1.6" /><path d="M9.5 2.5v3M14.5 2.5v3M9.5 18.5v3M14.5 18.5v3M2.5 9.5h3M2.5 14.5h3M18.5 9.5h3M18.5 14.5h3" strokeWidth="1.6" strokeLinecap="round" /></>),
  config: I(<><circle cx="12" cy="12" r="3" strokeWidth="1.6" /><path d="M12 2.8v2.4M12 18.8v2.4M4.9 7l2.1 1.2M17 15.8l2.1 1.2M4.9 17l2.1-1.2M17 8.2l2.1-1.2" strokeWidth="1.6" strokeLinecap="round" /></>),
};

// ícone de cada sub-tela (abas no topo de uma seção)
const TRACO = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": true, className: "h-4 w-4", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const ICONE_SUBTELA: Record<string, ReactNode> = {
  "/sugestoes": <svg {...TRACO}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1 1 1.7V16h5v-.4c0-.7.4-1.3 1-1.7A6 6 0 0 0 12 3z" /></svg>,
  "/criar": <svg {...TRACO}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v8M8 12h8" /></svg>,
  "/serie": <svg {...TRACO}><path d="M3 7h13M3 12h13M3 17h9M19 14v6M16 17h6" /></svg>,
  "/posts": <svg {...TRACO}><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M4 9.5h16" /></svg>,
  "/aprovacao": <svg {...TRACO}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></svg>,
  "/notificacoes": <svg {...TRACO}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" /><path d="M10 20.5h4" /></svg>,
  "/busca": <svg {...TRACO}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>,
  "/historico": <svg {...TRACO}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  "/lote": <svg {...TRACO}><path d="m12 4 8.5 4.5L12 13 3.5 8.5 12 4z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5" /></svg>,
  "/calendario": <svg {...TRACO}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>,
  "/storyboard": <svg {...TRACO}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M7.5 4.5v15M16.5 4.5v15M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4" /></svg>,
  "/biblioteca": <svg {...TRACO}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="m20.5 16-5-5-7.5 7.5" /></svg>,
};

// Menu lateral em dois grupos: o dia a dia no alto, a gestão embaixo. Contadores e descrição em cada item.
const GRUPOS: GrupoMenu[] = [
  { titulo: "Dia a dia", itens: [
    { href: "/dashboard", label: "Início", icone: "home", desc: "o que pede ação hoje" },
    { href: "/aprovacao", label: "Aprovação", icone: "aprovar", desc: "posts aguardando você", contagem: "aprovacao", alerta: true },
    { href: "/historico", label: "Histórico", icone: "historico", desc: "o que saiu e o que falhou", contagem: "falhas", alerta: true },
    { href: "/criar", label: "Criar", icone: "criar", desc: "post novo, do zero" },
    { href: "/posts", label: "Posts", icone: "posts", desc: "gerar, aprovar e publicar" },
    { href: "/calendario", label: "Calendário", icone: "calendario", desc: "o que tem hora marcada" },
    { href: "/biblioteca", label: "Biblioteca", icone: "biblioteca", desc: "imagens e vídeos enviados" },
    { href: "/notificacoes", label: "Notificações", icone: "notificacoes", desc: "avisos do sistema", contagem: "notificacoes" },
  ] },
  { titulo: "Gestão", itens: [
    { href: "/marcas", label: "Marcas", icone: "marcas", desc: "identidade e horários" },
    { href: "/contas", label: "Contas", icone: "contas", desc: "conexão com as redes" },
    { href: "/time", label: "Time", icone: "time", desc: "pessoas e funções" },
    { href: "/relatorios", label: "Relatórios", icone: "relatorios", desc: "concorrentes e resultados" },
    { href: "/consumo", label: "Consumo de IA", icone: "consumo", desc: "uso e limite do mês" },
    { href: "/config", label: "Configurações", icone: "config", desc: "integrações e aparência" },
  ] },
];

// Logo do Marketing Studio: marca própria em SVG (quadrado de tinta com três barras; a primeira na cor da marca).
function MarcaLogo({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" aria-hidden className="h-8 w-8 shrink-0">
        <rect x="1" y="1" width="30" height="30" rx="8" className="fill-ink" />
        <rect x="8" y="9" width="4" height="14" rx="2" style={{ fill: "var(--brand, #E4572E)" }} />
        <rect x="14" y="13" width="4" height="10" rx="2" className="fill-canvas" />
        <rect x="20" y="9" width="4" height="14" rx="2" className="fill-canvas" />
      </svg>
      {!compacto && (
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight text-ink">Marketing Studio</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-faint">console</div>
        </div>
      )}
    </div>
  );
}

const SECTIONS: Section[] = [
  { key: "inicio", label: "Início", icon: I(<><rect x="4" y="4" width="7" height="9" rx="1.5" strokeWidth="1.6" /><rect x="4" y="16" width="7" height="4" rx="1.5" strokeWidth="1.6" /><rect x="13" y="4" width="7" height="4" rx="1.5" strokeWidth="1.6" /><rect x="13" y="11" width="7" height="9" rx="1.5" strokeWidth="1.6" /></>), items: [{ href: "/dashboard", label: "Dashboard" }] },
  // Ordem do submenu = ordem do trabalho: de onde a ideia nasce até ela ir ao ar.
  // As três primeiras são o caminho de uma publicação; as três últimas são apoio.
  { key: "conteudo", label: "Conteúdo", icon: I(<><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.6" /><path d="M4 9h16M9 9v11" strokeWidth="1.5" /></>), items: [
    { href: "/sugestoes", label: "Sugestões", hint: "ideias da IA, vire rascunho" },
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
  // recolhe o menu para uma faixa de ícones; a escolha fica salva e o atalho é Ctrl/⌘ + B
  const [recolhido, setRecolhido] = useState(false);
  function alternarMenu() {
    setRecolhido((cur) => {
      const next = !cur;
      try {
        window.localStorage.setItem("ms.menu.recolhido", next ? "1" : "0");
      } catch {}
      return next;
    });
  }
  useEffect(() => {
    try {
      setRecolhido(window.localStorage.getItem("ms.menu.recolhido") === "1");
    } catch {}
    function atalho(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setRecolhido((cur) => {
          const next = !cur;
          try {
            window.localStorage.setItem("ms.menu.recolhido", next ? "1" : "0");
          } catch {}
          return next;
        });
      }
    }
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);
  const openKey = override?.path === pathname ? override.key : auto;

  const panel = openKey ? SECTIONS.find((s) => s.key === openKey) : undefined;

  // D04: todas as telas para a paleta de comandos
  const telas: PaletteItem[] = SECTIONS.flatMap((s) =>
    s.items.map((it) => ({ href: it.href, label: it.label, group: "Telas" as const, hint: it.hint })),
  );

  return (
    <div className="min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-panel transition-[width] duration-300 md:flex ${recolhido ? "w-16" : "w-72"}`}>
        <div className={`flex items-center ${recolhido ? "flex-col gap-3 px-2 pb-3 pt-4" : "px-4 pb-3 pt-4"}`}>
          <Link href="/dashboard" aria-label="Marketing Studio · início" className="min-w-0 flex-1">
            <MarcaLogo compacto={recolhido} />
          </Link>
          <button
            type="button"
            onClick={alternarMenu}
            aria-label={recolhido ? "Mostrar menu" : "Ocultar menu"}
            title={`${recolhido ? "Mostrar" : "Ocultar"} menu (Ctrl/⌘ + B)`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line text-faint transition-colors hover:bg-panel2 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4">
              <path d={recolhido ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-3">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              {recolhido ? (
                <div className="mx-2 mb-2 h-px bg-line" aria-hidden />
              ) : (
                <div className="flex items-center gap-2 px-2.5 pb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-ink"><span aria-hidden className="h-3.5 w-0.5 rounded-full bg-warn" />{g.titulo}</div>
              )}
              <ul className="space-y-0.5">
                {g.itens.map((it) => {
                  const on = pathname === it.href || pathname.startsWith(it.href + "/");
                  const n = it.contagem ? contagens[it.contagem] : 0;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        title={recolhido ? it.label : undefined}
                        aria-current={on ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors ${recolhido ? "justify-center px-0" : ""} ${on ? "bg-panel2 text-ink" : "text-dim hover:bg-panel2/60 hover:text-ink"}`}
                      >
                        <span className={on ? "text-ink" : "text-faint"}>{ICONES[it.icone]}</span>
                        <span className={`min-w-0 flex-1 ${recolhido ? "hidden" : ""}`}>
                          <span className="block truncate text-[12px] font-semibold uppercase leading-tight tracking-[0.08em]">{it.label}</span>
                          <span className="block truncate text-[11px] leading-tight text-faint">{it.desc}</span>
                        </span>
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
          <div className={recolhido ? "hidden" : ""}>
            <BrandSwitcher marcas={marcas} atual={marcaSel?.slug ?? null} />
          </div>
          <div className="flex items-center gap-2">
            {picture ? (
              <Avatar src={picture} nome={initials(who)} cor="#3a3a40" title={who} />
            ) : (
              <span title={who} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel2 text-[11px] font-semibold text-dim">
                {initials(who)}
              </span>
            )}
            <span className={`min-w-0 flex-1 truncate text-xs text-dim ${recolhido ? "hidden" : ""}`}>{who}</span>
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
      <Avisos />
      <Suspense fallback={null}>
        <AvisoDaUrl />
      </Suspense>
      <main className={`min-w-0 overflow-x-hidden pb-20 transition-[padding] duration-300 md:pb-0 ${recolhido ? "md:pl-16" : "md:pl-72"}`}>
        <div className="mx-auto w-full max-w-[1600px] min-w-0 px-6 py-8 md:px-12 md:py-12">
          {/* D05: faixa de destaque na cor da marca escolhida */}
          {marcaSel && <div className="mb-4 h-1 rounded-full" style={{ background: marcaSel.cor }} aria-hidden />}
          <RetornoSessao />
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-dim">Marketing Studio</span>
          </div>
          {/* D03: sub-telas da secao como abas no topo; o trilho fica so com as secoes */}
          {current && current.items.length > 1 && (
            <nav aria-label="Abas da seção" className="mb-6 flex flex-wrap gap-1 rounded-xl border border-line bg-panel p-1.5">
              {current.items.map((it) => {
                const on = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${on ? "bg-panel2 text-ink shadow-sm" : "text-faint hover:bg-panel2/60 hover:text-dim"}`}
                  >
                    <span className={on ? "text-warn" : "text-faint"}>{ICONE_SUBTELA[it.href]}</span>
                    {it.label}
                  </Link>
                );
              })}
            </nav>
          )}
          {children}
        </div>
      </main>
      <Atalhos />
      <MobileNav telas={telas} />
    </div>
  );
}
