"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { avisar } from "@/components/avisos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sessaoExpirou } from "@/lib/sessao";
import { adaptar, REDES, type RedeId } from "@/lib/variantes";
import type { Post, Analytics } from "@/server/posts";
import {
  approvePost,
  publishPostAction,
  removePost,
  generatePostImage,
  saveLegenda,
  historicoLegenda,
  listarComentarios,
  versoesDaRede,
  salvarVersaoRede,
  reordenarMidiaPost,
  duplicarPost,
  comentarTrecho,
  resolverComentario,
  type ComentarioTrecho,
  type ActionResult,
} from "@/app/(app)/posts/actions";
import { StatusBadge } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { InstagramPreview } from "@/components/instagram-preview";
import { TIPO, FORMATO, STATUS, fmtDate, type StatusKey } from "@/lib/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string; avatar: string | null };
const STATUS_ORDER: StatusKey[] = ["draft", "approved", "scheduled", "published", "failed"];

/** etapas do funil — viram o filtro rápido do topo da tela */
type Etapa = "sem_arte" | "pronto" | "aprovado" | "publicado";

const semArte = (p: Post) => p.status === "draft" && p.media.length === 0;
const prontoPraAprovar = (p: Post) => p.status === "draft" && p.media.length > 0;
const naEtapa = (p: Post, e: Etapa) =>
  e === "sem_arte"
    ? semArte(p)
    : e === "pronto"
      ? prontoPraAprovar(p)
      : e === "aprovado"
        ? p.status === "approved" || p.status === "scheduled"
        : p.status === "published";

function Dropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: { value: string; label: string; dot?: string }[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.size;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm transition-colors ${
          count ? "border-line2 bg-panel2 text-ink" : "border-line bg-panel text-dim hover:text-ink"
        }`}
      >
        {label} {count > 0 && <span className="text-info">({count})</span>}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5 text-faint" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-72 w-56 overflow-auto rounded-md border border-line bg-panel p-1 shadow-xl">
            <button
              type="button"
              onClick={onClear}
              className="block w-full rounded px-2 py-1.5 text-left text-xs text-faint hover:bg-panel2 hover:text-dim"
            >
              limpar (todas)
            </button>
            {options.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-dim hover:bg-panel2"
              >
                <input
                  type="checkbox"
                  checked={selected.has(o.value)}
                  onChange={() => onToggle(o.value)}
                  className="accent-ink"
                />
                {o.dot && <span className="h-2 w-2 rounded-full" style={{ background: o.dot }} />}
                <span className="truncate">{o.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Trilha do funil: o que precisa acontecer com um post, em ordem, e quantos
 * estão parados em cada etapa. Cada etapa também é o filtro dela — responde
 * "o que eu faço agora?" sem obrigar a decorar o significado de cada status.
 */
function Trilha({
  posts,
  etapa,
  onEtapa,
}: {
  posts: Post[];
  etapa: Etapa | null;
  onEtapa: (e: Etapa | null) => void;
}) {
  const passos: { key: Etapa; n: number; titulo: string; acao: string }[] = [
    {
      key: "sem_arte",
      n: posts.filter(semArte).length,
      titulo: "Falta a imagem",
      acao: "abra o post e clique em Gerar imagem",
    },
    {
      key: "pronto",
      n: posts.filter(prontoPraAprovar).length,
      titulo: "Pronto pra aprovar",
      acao: "revise a legenda e clique em Aprovar",
    },
    {
      key: "aprovado",
      n: posts.filter((p) => p.status === "approved" || p.status === "scheduled").length,
      titulo: "Aprovado",
      acao: "clique em Publicar (ou espere o horário agendado)",
    },
    {
      key: "publicado",
      n: posts.filter((p) => p.status === "published").length,
      titulo: "No ar",
      acao: "já foi publicado no Instagram",
    },
  ];

  return (
    <section className="mb-5 rounded-lg border border-line bg-panel/50 p-4">
      <h2 className="mb-1 text-sm font-semibold text-ink">Como um post vai ao ar</h2>
      <p className="mb-3 max-w-2xl text-xs leading-relaxed text-dim">
        A IA escreve a legenda e o prompt da arte, mas a imagem só é gerada quando você manda, e o
        post só vai pro Instagram depois de aprovado. Clique numa etapa pra ver só os posts dela.
      </p>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {passos.map((p, i) => {
          const on = etapa === p.key;
          return (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => onEtapa(on ? null : p.key)}
                aria-pressed={on}
                className={`h-full w-full rounded-md border p-3 text-left transition-colors ${
                  on ? "border-line2 bg-panel2" : "border-line bg-panel hover:border-line2"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                      p.n > 0 && p.key !== "publicado" ? "bg-ink text-canvas" : "bg-panel2 text-faint"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{p.titulo}</span>
                  <span className={`shrink-0 text-sm font-semibold ${p.n > 0 ? "text-ink" : "text-faint"}`}>
                    {p.n}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-faint">{p.acao}</p>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// D45: resultado do post em uma frase, pelo estado em que ele esta
function resultadoFrase(p: Post): string {
  if (p.status === "published") return "Saiu no ar sem erros.";
  if (p.status === "failed") return `Não saiu: ${p.erro ?? "motivo não registrado"}.`;
  if (p.status === "scheduled") return "Vai sair no horário agendado.";
  if (p.status === "approved") return "Aprovado, esperando o horário de saída.";
  return "Ainda é rascunho.";
}

export function PostsView({
  posts,
  brands,
  analytics,
  marcaInicialId = null,
  analistaInicial,
}: {
  posts: Post[];
  brands: BrandLite[];
  analytics: Analytics;
  // D05: marca ativa do seletor global; abre a tela ja filtrada por ela
  marcaInicialId?: string | null;
  analistaInicial?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"list" | "grade" | "semana">("grade");
  // D07: semana exibida no quadro (0 = esta semana)
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [tab, setTab] = useState<"todos" | "posts" | "reels">("todos");
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [brandSel, setBrandSel] = useState<Set<string>>(
    () => new Set(marcaInicialId ? [marcaInicialId] : []),
  );
  const [statusSel, setStatusSel] = useState<Set<string>>(new Set());
  // M34: folha de filtros no celular
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  // busca por texto: legenda, hashtag, nome da marca ou nome do analista
  const [busca, setBusca] = useState("");
  // D38: clicar numa pessoa no organograma abre a lista dos posts dela
  const [analistaSel, setAnalistaSel] = useState<Set<string>>(new Set(analistaInicial ? [analistaInicial] : []));
  const [openId, setOpenId] = useState<string | null>(null);
  const [showRank, setShowRank] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [genId, setGenId] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState("");
  // D09: legenda em edicao no detalhe do post
  const [legDraft, setLegDraft] = useState("");
  // D09: reescrita com IA e historico de versoes da legenda
  const [aiLeg, setAiLeg] = useState(false);
  const [hist, setHist] = useState<string[] | null>(null);
  // D09: texto de cada rede (carregado do servidor quando o post abre)
  const [versoes, setVersoes] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!openId) return;
    versoesDaRede(openId).then(setVersoes).catch(() => setVersoes({}));
  }, [openId]);
  // M41: comentario preso ao trecho selecionado na legenda
  const [selTrecho, setSelTrecho] = useState("");
  // M05: no celular, abas Legenda e Midia e agenda (no desktop as duas colunas ficam juntas)
  const [abaMob, setAbaMob] = useState<"legenda" | "midia">("legenda");
  const [comTexto, setComTexto] = useState("");
  const [coms, setComs] = useState<ComentarioTrecho[] | null>(null);

  const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const analistas = useMemo(
    () => [...new Set(posts.map((p) => p.analista).filter(Boolean) as string[])].sort(),
    [posts]
  );

  const toggler = (set: Set<string>, setter: (s: Set<string>) => void) => (v: string) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };

  const norm = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const buscaNormalizada = norm(busca.trim());
  const textoDoPost = (p: Post) => {
    const marca = byId.get(p.brand_id)?.nome ?? "";
    return norm([p.legenda ?? "", (p.hashtags ?? []).join(" "), marca, p.analista ?? ""].join(" "));
  };

  const filtered = posts.filter(
    (p) =>
      (etapa === null || naEtapa(p, etapa)) &&
      (brandSel.size === 0 || brandSel.has(p.brand_id)) &&
      (statusSel.size === 0 || statusSel.has(p.status)) &&
      (analistaSel.size === 0 || (p.analista ? analistaSel.has(p.analista) : false)) &&
      (buscaNormalizada === "" || textoDoPost(p).includes(buscaNormalizada))
  );

  const isReel = (p: Post) => p.tipo === "reel";
  const reelCount = filtered.filter(isReel).length;
  const shown =
    tab === "todos" ? filtered : filtered.filter((p) => (tab === "reels" ? isReel(p) : !isReel(p)));

  // M47: troca a ordem de dois slides do carrossel aberto e grava
  function reordenarSlide(de: number, para: number) {
    if (!open || para < 0 || para >= open.media.length) return;
    const nova = [...open.media];
    const [x] = nova.splice(de, 1);
    nova.splice(para, 0, x);
    startTransition(async () => {
      const r = await reordenarMidiaPost(open.id, nova);
      setMsg(r.ok ? null : { kind: "err", text: r.error });
      router.refresh();
    });
  }

  // M38/M39: etapas da publicacao enquanto ela roda, e o resultado no fim
  const [pubEtapa, setPubEtapa] = useState<{ n: number; ok?: boolean; erro?: string; hora?: string } | null>(null);
  const act = (fn: (id: string) => Promise<ActionResult>, id: string, okText?: string) =>
    startTransition(async () => {
      const pub = fn === publishPostAction;
      let timer: ReturnType<typeof setInterval> | undefined;
      if (pub) {
        let n = 0;
        setPubEtapa({ n: 0 });
        timer = setInterval(() => {
          n = Math.min(n + 1, 2);
          setPubEtapa((e) => (e && !e.ok && !e.erro ? { n } : e));
        }, 900);
      }
      const r = await fn(id);
      if (timer) clearInterval(timer);
      if (pub) {
        setPubEtapa(
          r.ok
            ? { n: 3, ok: true, hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }
            : { n: 3, erro: r.error },
        );
      }
      setMsg(r.ok ? (okText ? { kind: "ok", text: okText } : null) : { kind: "err", text: r.error });
      if (r.ok && okText) avisar("ok", okText);
      if (!r.ok) avisar("erro", r.error);
      router.refresh();
    });

  /** gera a arte a partir do prompt do post — fora do transition, porque leva ~40s */
  async function gerarArte(id: string, prompt?: string) {
    setGenId(id);
    setMsg(null);
    try {
      const r = await generatePostImage(id, prompt);
      if (r.ok) {
        setMsg({ kind: "ok", text: "Imagem gerada e anexada ao post. Agora dá pra aprovar." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: r.error });
      }
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "falha ao gerar imagem" });
    } finally {
      setGenId(null);
    }
  }

  // D08: Shift + clique seleciona o intervalo entre o ultimo item marcado e este
  const ultimoSel = useRef<string | null>(null);
  const toggleComShift = (id: string, shift: boolean, ordem: string[]) => {
    const de = ultimoSel.current;
    if (shift && de) {
      const a = ordem.indexOf(de);
      const b = ordem.indexOf(id);
      if (a >= 0 && b >= 0) {
        const [x, y] = a < b ? [a, b] : [b, a];
        setSel((prev) => {
          const n = new Set(prev);
          for (let i = x; i <= y; i++) n.add(ordem[i]);
          return n;
        });
        ultimoSel.current = id;
        return;
      }
    }
    toggleSel(id);
    ultimoSel.current = id;
  };

  const toggleSel = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allSel = shown.length > 0 && shown.every((p) => sel.has(p.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(shown.map((p) => p.id)));

  const approveSelected = () =>
    startTransition(async () => {
      let ok = 0;
      let semImagem = 0;
      for (const id of sel) {
        const p = posts.find((x) => x.id === id);
        if (p?.status !== "draft") continue;
        const r = await approvePost(id);
        if (r.ok) ok++;
        else semImagem++;
      }
      setSel(new Set());
      setMsg({
        kind: semImagem > 0 ? "err" : "ok",
        text:
          semImagem > 0
            ? `${ok} aprovado(s). ${semImagem} ficaram de fora por não ter imagem, gere a arte primeiro.`
            : `${ok} post(s) aprovado(s). Foram pra etapa 3, prontos pra publicar.`,
      });
      router.refresh();
    });

  /** gera a arte de todos os selecionados que ainda não têm imagem, um a um */
  async function gerarSelecionadas() {
    const alvos = [...sel].filter((id) => {
      const p = posts.find((x) => x.id === id);
      return p && semArte(p);
    });
    if (alvos.length === 0) {
      setMsg({ kind: "err", text: "nenhum dos posts selecionados está sem imagem" });
      return;
    }
    let ok = 0;
    for (const [i, id] of alvos.entries()) {
      setGenId(id);
      setMsg({ kind: "ok", text: `gerando ${i + 1} de ${alvos.length}… (cada uma leva ~40s)` });
      const r = await generatePostImage(id);
      if (r.ok) ok++;
    }
    setGenId(null);
    setSel(new Set());
    setMsg({
      kind: ok === alvos.length ? "ok" : "err",
      text: `${ok} de ${alvos.length} imagem(ns) gerada(s).`,
    });
    router.refresh();
  }

  const deleteSelected = () =>
    startTransition(async () => {
      const n = sel.size;
      for (const id of sel) await removePost(id);
      setSel(new Set());
      setMsg({ kind: "ok", text: `${n} post(s) excluído(s).` });
      router.refresh();
    });

  const open = openId ? posts.find((p) => p.id === openId) ?? null : null;

  const abrir = (p: Post) => {
    setOpenId(p.id);
    setPromptDraft(p.imagem_prompt ?? "");
    // B02: o texto em edicao fica no navegador; se a sessao cair, volta do mesmo jeito
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem(`ms_rascunho_post_${p.id}`);
    } catch {
      salvo = null;
    }
    setLegDraft(salvo ?? p.legenda ?? "");
    setMsg(null);
  };

  // D06: cartao da grade com faixa de estado, marca e data na base, e uma acao principal que muda com o estado.
  // D09: reescreve a legenda pela IA; so vai ao campo, salvar continua sendo um passo separado
  // B07: o texto aparece conforme a IA escreve; se o provedor cai, o parcial vira rascunho
  async function reescreverLegenda() {
    if (!open) return;
    setAiLeg(true);
    const base = legDraft;
    setLegDraft("");
    try {
      const r = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: open.brand_id, atual: base, tipo: open.tipo, tom: "direto", tamanho: "media", template: "", assunto: "", segmento: "", stream: true }),
      });
      if (sessaoExpirou(r)) return;
      if (!r.ok || !r.body) throw new Error("falha na IA");
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let visto = "";
      let fim: { ok: boolean; motivo?: string; texto?: string; parcial?: string } | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const t = dec.decode(value, { stream: true });
        const i = t.indexOf("\u0001");
        if (i >= 0) {
          visto += t.slice(0, i);
          setLegDraft(visto);
          fim = JSON.parse(t.slice(i + 1));
          break;
        }
        visto += t;
        setLegDraft(visto);
      }
      if (fim?.ok) {
        setLegDraft(fim.texto ?? visto);
        setMsg({ kind: "ok", text: "Legenda reescrita. Confira e salve." });
      } else {
        const parcial = (fim?.parcial ?? visto).trim();
        setLegDraft(parcial || base);
        if (parcial) {
          try {
            localStorage.setItem(`ms_rascunho_post_${open.id}`, parcial);
          } catch {
            // sem persistencia
          }
        }
        setMsg({ kind: "err", text: `${fim?.motivo ?? "falha na IA"}. ${parcial ? "O texto parcial ficou guardado como rascunho." : "Nada foi gerado; o texto anterior foi mantido."}` });
      }
    } catch (e) {
      setLegDraft(base);
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "falha na IA" });
    } finally {
      setAiLeg(false);
    }
  }

  async function abrirHistorico() {
    if (!open) return;
    setHist(await historicoLegenda(open.id));
  }

  // D46: resumo do que sai antes de publicar
  // M30: folha de confirmacao; com alerta, so libera depois de marcar a revisao
  const [pub, setPub] = useState<{ p: Post; alertas: string[]; aceito: boolean; onOk: () => void } | null>(null);
  const confirmarPublicar = (p: Post, onOk: () => void) => {
    const alertas: string[] = [];
    if (p.media.length === 0) alertas.push("sem imagem");
    if (!p.legenda?.trim()) alertas.push("sem legenda");
    setPub({ p, alertas, aceito: false, onOk });
  };

  // D07: dia local de cada post, faixa de sete dias e grupos por dia (sem abas)
  const chaveDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dataDe = (p: Post) => new Date(p.scheduled_at ?? p.created_at);
  const hoje0 = new Date();
  hoje0.setHours(0, 0, 0, 0);
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje0);
    d.setDate(hoje0.getDate() + i);
    const k = chaveDia(d);
    const doDia = filtered.filter((p) => chaveDia(dataDe(p)) === k);
    return {
      key: k,
      rotulo: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
      posts: doDia.filter((p) => !isReel(p)).length,
      reels: doDia.filter((p) => isReel(p)).length,
    };
  });
  const chavesDias = [...new Set(shown.map((p) => chaveDia(dataDe(p))))].sort();
  const grupos = chavesDias.map((k) => ({
    key: k,
    rotulo: new Date(`${k}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }),
    itens: shown.filter((p) => chaveDia(dataDe(p)) === k),
  }));

  const gradeCard = (p: Post) => {
    const b = byId.get(p.brand_id);
    const st = STATUS[p.status as StatusKey];
    const faltaArte = semArte(p);
    const semLegenda = !p.legenda?.trim();
    const quando = p.scheduled_at ?? p.created_at;
    const acaoBtn =
      "rounded-md border border-line px-2 py-0.5 text-[11px] text-dim transition-colors hover:border-line2 hover:text-ink disabled:opacity-50";
    let primaria: React.ReactNode;
    if (p.status === "failed") {
      const token = /token|expir|autoriz/i.test(p.erro ?? "");
      primaria = token && b ? (
        <Link href={`/marcas/${b.slug}/conectar`} className={acaoBtn + " text-bad hover:text-bad"} onClick={(e) => e.stopPropagation()}>
          Reconectar
        </Link>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); abrir(p); }} className={acaoBtn}>Ver erro</button>
      );
    } else if (faltaArte) {
      primaria = (
        <button
          onClick={(e) => { e.stopPropagation(); gerarArte(p.id); }}
          disabled={genId !== null}
          title={p.imagem_prompt ?? "sem prompt: abra o post e escreva um"}
          className={acaoBtn + " text-warn hover:text-warn"}
        >
          {genId === p.id ? "gerando…" : "Gerar imagem"}
        </button>
      );
    } else if (p.status === "draft" && semLegenda) {
      primaria = <button onClick={(e) => { e.stopPropagation(); abrir(p); }} className={acaoBtn}>Escrever</button>;
    } else if (p.status === "draft" && !p.scheduled_at) {
      primaria = <button onClick={(e) => { e.stopPropagation(); abrir(p); }} className={acaoBtn}>Agendar</button>;
    } else if (p.status === "draft") {
      primaria = (
        <button
          onClick={(e) => { e.stopPropagation(); act(approvePost, p.id, "Post aprovado. Já dá pra publicar."); }}
          disabled={pending}
          className={acaoBtn + " hover:text-ok hover:border-ok/50"}
        >
          Aprovar
        </button>
      );
    } else if (p.status === "approved" || p.status === "scheduled") {
      primaria = (
        <button
          onClick={(e) => { e.stopPropagation(); confirmarPublicar(p, () => act(publishPostAction, p.id, "Publicado no Instagram.")); }}
          disabled={pending}
          className={acaoBtn + " hover:text-info hover:border-info/50"}
        >
          Publicar
        </button>
      );
    } else {
      primaria = <button onClick={(e) => { e.stopPropagation(); abrir(p); }} className={acaoBtn}>Abrir</button>;
    }
    return (
      <div key={p.id} className="flex flex-col">
        {/* D06: faixa de estado no topo do cartao */}
        <div className="mb-1.5 flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: `${st?.dot ?? "#888"}22`, color: st?.dot ?? "#888" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st?.dot ?? "#888" }} aria-hidden />
          {st?.label ?? p.status}
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => abrir(p)}
          title="Abrir o post"
          className="cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <InstagramPreview
            compact
            username={b?.slug ?? "?"}
            cor={b?.cor_principal ?? "#000"}
            picture={b?.avatar}
            media={p.media}
            legenda={p.legenda}
            hashtags={p.hashtags}
            tipo={p.tipo}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px]">
          <input
            type="checkbox"
            checked={sel.has(p.id)}
            onClick={(e) => toggleComShift(p.id, e.shiftKey, shown.map((x) => x.id))}
            onChange={() => undefined}
            className="accent-ink"
            aria-label="Selecionar"
          />
          <span className="min-w-0 truncate text-dim">{b?.nome ?? "?"}</span>
          <span className="text-faint">· {st?.label ?? p.status} · {fmtDate(quando)}</span>
          <span className="ml-auto">{primaria}</span>
        </div>
      </div>
    );
  };

  // D07: quadro semanal (dia x formato). Celulas sem post mostram "vazio".
  const renderSemana = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dow = (hoje.getDay() + 6) % 7; // segunda = 0
    const seg = new Date(hoje);
    seg.setDate(hoje.getDate() - dow + semanaOffset * 7);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(seg);
      d.setDate(seg.getDate() + i);
      return d;
    });
    const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const colunas = [
      { key: "feed", label: "Feed", ratio: "1:1 e 4:5", match: (p: Post) => p.tipo === "image" || p.tipo === "story" },
      { key: "carrossel", label: "Carrossel", ratio: "4:5", match: (p: Post) => p.tipo === "carousel" },
      { key: "reels", label: "Reels", ratio: "9:16", match: (p: Post) => p.tipo === "reel" },
    ].filter((c) => tab === "todos" || (tab === "reels" ? c.key === "reels" : c.key !== "reels"));
    const comData = shown.filter((p) => p.scheduled_at);
    const semData = shown.length - comData.length;
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const nomeDia = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const hora = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const navBtn = "rounded-md border border-line px-2 py-0.5 text-dim transition-colors hover:text-ink";
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-dim">
          <button type="button" className={navBtn} onClick={() => setSemanaOffset((o) => o - 1)} aria-label="Semana anterior">‹</button>
          <span>Semana de {fmt(dias[0])} a {fmt(dias[6])}</span>
          <button type="button" className={navBtn} onClick={() => setSemanaOffset((o) => o + 1)} aria-label="Próxima semana">›</button>
          {semanaOffset !== 0 && (
            <button type="button" className="text-info hover:underline" onClick={() => setSemanaOffset(0)}>Esta semana</button>
          )}
          {semData > 0 && <span className="ml-auto text-faint">{semData} sem data, fora do quadro</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1 text-left text-xs">
            <thead>
              <tr>
                <th className="w-28 px-2 font-normal text-faint">Dia</th>
                {colunas.map((c) => (
                  <th key={c.key} className="px-2 font-medium text-dim">
                    {c.label} <span className="font-normal text-faint">· {c.ratio}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => {
                const hojeDia = mesmoDia(d, hoje);
                return (
                  <tr key={d.toISOString()}>
                    <td className={`px-2 py-2 align-top ${hojeDia ? "font-semibold text-ink" : "text-dim"}`}>
                      {nomeDia(d)} {fmt(d)}
                      {hojeDia && <span className="ml-1 text-[10px] text-info">hoje</span>}
                    </td>
                    {colunas.map((c) => {
                      const itens = comData
                        .filter((p) => mesmoDia(new Date(p.scheduled_at!), d) && c.match(p))
                        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
                      return (
                        <td key={c.key} className="rounded-md border border-line bg-panel p-2 align-top">
                          {itens.length === 0 ? (
                            <span className="text-faint">vazio</span>
                          ) : (
                            <ul className="space-y-1.5">
                              {itens.map((p) => {
                                const b = byId.get(p.brand_id);
                                const st = STATUS[p.status as StatusKey];
                                return (
                                  <li key={p.id}>
                                    <button
                                      type="button"
                                      onClick={() => abrir(p)}
                                      className="w-full rounded-md border border-line px-2 py-1.5 text-left transition-colors hover:border-line2"
                                    >
                                      <span className="block text-ink">{hora(new Date(p.scheduled_at!))} · {b?.nome ?? "?"}</span>
                                      <span className="block text-[10px] text-faint">
                                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: st?.dot ?? "#888" }} />
                                        {st?.label ?? p.status}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Trilha posts={posts} etapa={etapa} onEtapa={setEtapa} />

      {msg && (
        <p
          className={`mb-4 flex items-start gap-3 rounded-md border px-3 py-2 text-sm ${
            msg.kind === "ok" ? "border-ok/30 bg-ok/5 text-ok" : "border-bad/30 bg-bad/5 text-bad"
          }`}
        >
          <span className="flex-1">{msg.text}</span>
          <button onClick={() => setMsg(null)} className="shrink-0 text-xs opacity-60 hover:opacity-100">
            fechar
          </button>
        </p>
      )}

      {/* M04: abas de estado fixas no celular, com a contagem de cada uma */}
      {(() => {
        const abas: { v: string; label: string; set: string[]; n: number }[] = [
          { v: "todos", label: "Todos", set: [], n: posts.filter((p) => !p.deleted_at).length },
          { v: "revisar", label: "Revisar", set: ["draft"], n: posts.filter((p) => !p.deleted_at && p.status === "draft").length },
          { v: "agendados", label: "Agendados", set: ["scheduled"], n: posts.filter((p) => !p.deleted_at && p.status === "scheduled").length },
          { v: "publicados", label: "Publicados", set: ["published"], n: posts.filter((p) => !p.deleted_at && p.status === "published").length },
        ];
        const ativa = (set: string[]) => set.length === statusSel.size && set.every((x) => statusSel.has(x));
        return (
          <div role="tablist" aria-label="Estado dos posts" className="sticky top-0 z-10 -mx-4 mb-3 flex gap-1 overflow-x-auto border-b border-line bg-canvas px-4 py-2 md:hidden">
            {abas.map((ab) => (
              <button
                key={ab.v}
                type="button"
                role="tab"
                aria-selected={ativa(ab.set)}
                onClick={() => setStatusSel(new Set(ab.set))}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${ativa(ab.set) ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"}`}
              >
                {ab.label} <span className="text-faint">{ab.n}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* D08: qualquer filtro vira selecao; o total visivel aparece antes de agir */}
      {(brandSel.size > 0 || statusSel.size > 0 || analistaSel.size > 0) && shown.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-xs">
          <span className="text-dim">Filtro ativo: {shown.length} resultado(s).</span>
          <button type="button" onClick={() => setSel(new Set(shown.map((p) => p.id)))} className="min-h-11 rounded-md border border-line px-3 text-info hover:text-ink md:min-h-0">
            Selecionar os {shown.length}
          </button>
        </div>
      )}

      {/* filtros */}
      {/* M34: no celular, os filtros abrem numa folha; no desktop ficam na linha */}
      <div className="mb-4 md:hidden">
        <button type="button" onClick={() => setFiltrosAbertos(true)} className="min-h-11 rounded-md border border-line px-4 text-sm text-dim">
          Filtros · {brandSel.size + statusSel.size + analistaSel.size}
        </button>
      </div>
      <div
        className={`mb-4 flex-wrap items-center gap-2 md:static md:flex md:max-h-none md:flex-row md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 ${
          filtrosAbertos
            ? "fixed inset-x-0 bottom-0 z-[55] flex max-h-[80vh] flex-col items-stretch overflow-y-auto rounded-t-xl border-t border-line bg-canvas p-4"
            : "hidden"
        }`}
      >
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-ink">Filtros</span>
          <button type="button" onClick={() => setFiltrosAbertos(false)} className="min-h-11 px-3 text-sm text-info">Mostrar resultados</button>
        </div>
        <label className="relative min-w-[240px] flex-1 max-w-md">
          <span className="sr-only">Buscar publicação</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por legenda, hashtag, marca ou analista"
            className="min-h-11 w-full rounded-lg border border-line bg-panel pl-9 pr-9 text-sm text-ink placeholder:text-faint"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-faint hover:bg-panel2 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </label>
        <Dropdown
          label="Marcas"
          options={brands.map((b) => ({ value: b.id, label: b.nome, dot: b.cor_principal }))}
          selected={brandSel}
          onToggle={toggler(brandSel, setBrandSel)}
          onClear={() => setBrandSel(new Set())}
        />
        <Dropdown
          label="Status"
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label, dot: STATUS[s].dot }))}
          selected={statusSel}
          onToggle={toggler(statusSel, setStatusSel)}
          onClear={() => setStatusSel(new Set())}
        />
        <Dropdown
          label="Funcionário"
          options={analistas.map((a) => ({ value: a, label: a }))}
          selected={analistaSel}
          onToggle={toggler(analistaSel, setAnalistaSel)}
          onClear={() => setAnalistaSel(new Set())}
        />
        {etapa && (
          <button
            type="button"
            onClick={() => setEtapa(null)}
            className="rounded-md border border-line2 bg-panel2 px-3 py-1.5 text-xs text-ink"
          >
            etapa filtrada ✕
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRank((s) => !s)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-panel px-3.5 text-sm text-dim transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8" /></svg>
            Ranking do time
          </button>
          <div className="inline-flex gap-1 rounded-lg border border-line bg-panel p-1">
            {(["list", "grade", "semana"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm transition-colors ${
                  view === v ? "bg-panel2 text-ink shadow-sm" : "text-dim hover:text-ink"
                }`}
              >
                {v === "list" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>}
                {v === "grade" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>}
                {v === "semana" && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>}
                {v === "list" ? "Lista" : v === "grade" ? "Grade" : "Semana"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showRank && (
        <div className="mb-5 rounded-lg border border-line bg-panel/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-ink">Ranking por funcionário</h3>
            <span className="text-xs text-faint">{analytics.deleted} post(s) excluído(s)</span>
          </div>
          {analytics.ranking.length === 0 ? (
            <p className="text-xs text-faint">Nenhum post com autor ainda. Aceite sugestões do time pra atribuir.</p>
          ) : (
            <ul className="space-y-1">
              {analytics.ranking.map((r) => (
                <li key={r.analista} className="flex items-center justify-between text-xs">
                  <span className="text-dim">{r.analista}</span>
                  <span className="text-faint">
                    <span className="text-ink">{r.total}</span> posts · {r.publicados} publicados
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <label className="flex cursor-pointer items-center gap-1.5 text-dim">
          <input type="checkbox" checked={allSel} onChange={toggleAll} className="accent-ink" />
          selecionar todos
        </label>
        <span className="text-faint">
          {shown.length} {shown.length === 1 ? "post" : "posts"}
          {pending && " · atualizando…"}
        </span>
        {sel.size > 0 && (
          <>
            <span className="text-line2">·</span>
            <span className="text-ink">{sel.size} selecionado(s)</span>
          </>
        )}
      </div>

      {/* D08: barra de acao fixa com contagem, resumo e confirmacao para excluir */}
      {sel.size > 0 && (() => {
        const escolhidos = posts.filter((p) => sel.has(p.id));
        const marcas = [...new Set(escolhidos.map((p) => byId.get(p.brand_id)?.nome ?? "?"))];
        const rascunhos = escolhidos.filter((p) => p.status === "draft").length;
        const pendentes = escolhidos.filter((p) => p.status === "draft" || p.status === "approved").length;
        const n = sel.size;
        return (
          <>
            <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-2 border-t border-line bg-panel/95 px-4 py-3 shadow-2xl backdrop-blur md:px-6">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{n} post(s) selecionado(s)</div>
                  <div className="truncate text-[11px] text-faint">
                    {marcas.join(", ")}
                    {rascunhos > 0 ? ` · ${rascunhos} rascunho(s) aguardando aprovação` : ""}
                    {pendentes === 0 && rascunhos === 0 ? " · nenhum pendente de aprovação" : ""}
                  </div>
                </div>
                <button type="button" onClick={gerarSelecionadas} disabled={pending || genId !== null}
                  className="rounded-md border border-warn/40 px-3 py-1.5 text-xs text-warn transition-colors hover:bg-warn/10 disabled:opacity-50">
                  Gerar imagens
                </button>
                <button type="button" onClick={approveSelected} disabled={pending || rascunhos === 0}
                  className="rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:border-ok/50 hover:text-ok disabled:opacity-50">
                  Aprovar {rascunhos > 0 ? rascunhos : ""}
                </button>
                <button type="button" onClick={() => setSel(new Set())}
                  className="px-2 py-1.5 text-xs text-faint hover:text-dim">
                  Desmarcar
                </button>
                <span className="h-6 w-px bg-line" aria-hidden />
                <button type="button" disabled={pending}
                  onClick={() => { if (window.confirm(`Excluir ${n} post(s)? Eles vão para Excluídos.`)) deleteSelected(); }}
                  className="rounded-md border border-bad/40 px-3 py-1.5 text-xs text-bad transition-colors hover:bg-bad/10 disabled:opacity-50">
                  Excluir {n}
                </button>
              </div>
            </div>
            <div className="h-20" aria-hidden />
          </>
        );
      })()}
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-10 text-center text-sm text-faint">
          Nenhum post com esses filtros.
        </p>
      ) : view === "semana" ? (
        renderSemana()
      ) : view === "grade" ? (
        <div className="space-y-5">
          {/* sete dias: volume e mix (feed/carrossel x reels) de cada dia */}
          <div className="grid grid-cols-7 gap-1.5">
            {diasSemana.map((d) => (
              <div key={d.key} className="rounded-md border border-line bg-panel px-2 py-1.5 text-[11px]">
                <div className="text-dim">{d.rotulo}</div>
                <div className="text-faint">{d.posts} posts · {d.reels} reels</div>
              </div>
            ))}
          </div>
          {grupos.map((g) => (
            <section key={g.key} className="space-y-3">
              <header className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <h3 className="text-sm font-semibold text-ink">{g.rotulo}</h3>
                <span className="text-xs text-faint">
                  {g.itens.length} {g.itens.length === 1 ? "post" : "posts"}
                  {g.itens.some(isReel) ? ` · ${g.itens.filter(isReel).length} reel(s)` : ""}
                </span>
              </header>
              <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">{g.itens.map(gradeCard)}</div>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((p) => {
            const b = byId.get(p.brand_id);
            const faltaArte = semArte(p);
            return (
              <li
                key={p.id}
                className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-line bg-panel py-3 pl-5 pr-4"
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: b?.cor_principal ?? "#3a3a40" }} />
                <input
                  type="checkbox"
                  checked={sel.has(p.id)}
                  onClick={(e) => toggleComShift(p.id, e.shiftKey, shown.map((x) => x.id))}
            onChange={() => undefined}
                  className="shrink-0 accent-ink"
                  aria-label="Selecionar"
                />
                <Avatar
                  src={b?.avatar}
                  nome={b?.nome ?? b?.slug ?? "?"}
                  cor={b?.cor_principal ?? "#888"}
                  title={b?.nome}
                />
                <button
                  type="button"
                  onClick={() => abrir(p)}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-panel2"
                >
                  {p.media[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.media[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-center text-[10px] leading-tight text-warn">
                      sem
                      <br />
                      imagem
                    </span>
                  )}
                </button>

                <button type="button" onClick={() => abrir(p)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm text-ink">
                    {p.legenda?.trim() || <span className="text-faint">(sem legenda)</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                    <span className="font-mono">@{b?.slug ?? "?"}</span>
                    {p.origem === "auto" && <span className="text-info">✦ time</span>}
                    <span>·</span>
                    <span>{TIPO[p.tipo] ?? p.tipo}</span>
                    {p.analista && (
                      <>
                        <span>·</span>
                        <span className="text-dim">por {p.analista}</span>
                      </>
                    )}
                    {p.fonte_tipo && (
                      <>
                        <span>·</span>
                        <span className="text-faint">
                          inspirado em {p.fonte_tipo === "noticia" ? "notícia" : "concorrente"}
                        </span>
                      </>
                    )}
                    {p.scheduled_at && (
                      <>
                        <span>·</span>
                        <span className="text-warn">{fmtDate(p.scheduled_at)}</span>
                      </>
                    )}
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={p.status} />
                  <div className="flex items-center gap-1.5">
                    {faltaArte ? (
                      <button
                        onClick={() => gerarArte(p.id)}
                        disabled={genId !== null}
                        className="rounded-md border border-warn/40 px-2.5 py-1 text-xs text-warn transition-colors hover:bg-warn/10 disabled:opacity-50"
                      >
                        {genId === p.id ? "gerando…" : "Gerar imagem"}
                      </button>
                    ) : (
                      p.status === "draft" && (
                        <button
                          onClick={() => act(approvePost, p.id, "Post aprovado. Já dá pra publicar.")}
                          disabled={pending}
                          className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:border-ok/50 hover:text-ok disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                      )
                    )}
                    {(p.status === "approved" || p.status === "scheduled") && (
                      <button
                        onClick={() => { confirmarPublicar(p, () => act(publishPostAction, p.id, "Publicado no Instagram.")); }}
                        disabled={pending}
                        className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:border-info/50 hover:text-info disabled:opacity-50"
                      >
                        Publicar
                      </button>
                    )}
                    <button
                      onClick={() => act(removePost, p.id)}
                      disabled={pending}
                      className="rounded-md border border-line px-2.5 py-1 text-xs text-faint transition-colors hover:border-bad/50 hover:text-bad disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* detalhe: simulação do Instagram + metadados */}
      {pubEtapa && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 sm:items-center sm:justify-center">
          <div className="w-full rounded-t-xl border-t border-line bg-canvas p-5 sm:max-w-sm sm:rounded-xl sm:border">
            {pubEtapa.erro ? (
              <>
                <p className="text-sm text-bad">Não saiu: {pubEtapa.erro}</p>
                <button type="button" onClick={() => setPubEtapa(null)} className="mt-3 min-h-11 w-full rounded-md border border-line text-sm text-dim">Fechar</button>
              </>
            ) : pubEtapa.ok ? (
              <>
                <p className="text-sm font-semibold text-ok">✓ Post publicado</p>
                <p className="mt-1 text-xs text-dim">Instagram · {pubEtapa.hora}</p>
                <div className="mt-4 flex gap-2">
                  <Link href="/criar" className="min-h-11 flex-1 rounded-md border border-line px-3 py-2.5 text-center text-sm text-dim">Criar outro da série</Link>
                  <button type="button" onClick={() => setPubEtapa(null)} className="min-h-11 flex-1 rounded-md bg-ink px-3 text-sm font-medium text-canvas">Fechar</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">Publicando…</p>
                <ol className="mt-3 space-y-2 text-sm">
                  {["Mídia enviada", "Publicação criada", "Confirmando na rede"].map((t, i) => (
                    <li key={t} className={i < pubEtapa.n ? "text-ok" : i === pubEtapa.n ? "text-ink" : "text-faint"}>
                      {i < pubEtapa.n ? "✓" : i === pubEtapa.n ? "●" : "○"} {t}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-faint">O botão fica travado até terminar.</p>
              </>
            )}
          </div>
        </div>
      )}

      {pub && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 sm:items-center sm:justify-center" onClick={() => setPub(null)}>
          <div className="w-full rounded-t-xl border-t border-line bg-canvas p-5 sm:max-w-sm sm:rounded-xl sm:border" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-ink">Publicar agora?</div>
            <dl className="mt-3 space-y-1 text-xs text-dim">
              <div>Marca: {byId.get(pub.p.brand_id)?.nome ?? "?"}</div>
              <div>Rede: Instagram</div>
              <div>Quando: {pub.p.scheduled_at ? fmtDate(pub.p.scheduled_at) : "agora"}</div>
              <div>Legenda: {pub.p.legenda.length} caracteres</div>
            </dl>
            {pub.alertas.length > 0 && (
              <div className="mt-3 space-y-2">
                {pub.alertas.map((a) => (
                  <p key={a} className="rounded-md border border-warn/40 px-3 py-2 text-xs text-warn">{a}</p>
                ))}
                <label className="flex min-h-11 items-center gap-2 text-xs text-dim">
                  <input type="checkbox" checked={pub.aceito} onChange={(e) => setPub({ ...pub, aceito: e.target.checked })} className="h-5 w-5" />
                  Revisei e aceito o alerta
                </label>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setPub(null)} className="min-h-11 flex-1 rounded-md border border-line px-3 text-sm text-dim">Cancelar</button>
              <button
                type="button"
                disabled={pub.alertas.length > 0 && !pub.aceito}
                onClick={() => {
                  const ok = pub.onOk;
                  setPub(null);
                  ok();
                }}
                className="min-h-11 flex-1 rounded-md bg-ink px-3 text-sm font-medium text-canvas disabled:opacity-40"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center overflow-auto bg-black/70 p-0 sm:items-start sm:p-8"
          onClick={() => setOpenId(null)}
        >
          <div
            className="grid min-h-full w-full max-w-3xl gap-6 bg-canvas p-4 pb-24 sm:min-h-0 sm:rounded-xl sm:border sm:border-line sm:p-5 sm:pb-5 sm:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div role="tablist" aria-label="Seções do post" className="flex gap-1 border-b border-line pb-2 sm:hidden">
              {(["legenda", "midia"] as const).map((a) => (
                <button key={a} type="button" role="tab" aria-selected={abaMob === a} onClick={() => setAbaMob(a)} className={`min-h-11 flex-1 rounded-md text-sm ${abaMob === a ? "bg-panel2 text-ink" : "text-dim"}`}>
                  {a === "legenda" ? "Legenda" : "Mídia e agenda"}
                </button>
              ))}
            </div>
            {/* D09: editor da legenda a esquerda */}
            <div className={`${abaMob === "legenda" ? "flex" : "hidden"} flex-col gap-3 text-sm sm:flex`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-faint">Legenda</span>
                <span className="text-[11px] text-faint">{legDraft.length} / 2.200 caracteres</span>
              </div>
              <textarea
                value={legDraft}
                onChange={(e) => {
                  setLegDraft(e.target.value);
                  try {
                    localStorage.setItem(`ms_rascunho_post_${open.id}`, e.target.value);
                  } catch {
                    // sem persistencia
                  }
                }}
                onSelect={(e) => setSelTrecho(e.currentTarget.value.slice(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))}
                rows={12}
                className="w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-line2"
              />
              {/* M36: no celular, a barra de salvar fica colada no rodape, acima do teclado */}
              <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-4 py-2 md:static md:mx-0 md:border-0 md:p-0">
                <button
                  type="button"
                  disabled={pending || legDraft === (open.legenda ?? "")}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await saveLegenda(open.id, legDraft);
                      if (r.ok) {
                        try {
                          localStorage.removeItem(`ms_rascunho_post_${open.id}`);
                        } catch {
                          // sem persistencia
                        }
                      }
                      setMsg(r.ok ? { kind: "ok", text: "Legenda salva." } : { kind: "err", text: r.error });
                      router.refresh();
                    })
                  }
                  className="rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:border-ok/50 hover:text-ok disabled:opacity-40"
                >
                  Salvar legenda
                </button>
                <span className="text-[11px] text-faint">{(legDraft.match(/#\w+/g) ?? []).length} hashtags no texto</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={reescreverLegenda}
                  disabled={aiLeg || pending}
                  className="rounded-md border border-line px-3 py-1.5 text-xs text-info transition-colors hover:bg-panel2 disabled:opacity-40"
                >
                  {aiLeg ? "reescrevendo…" : "✦ Reescrever com IA"}
                </button>
                <button
                  type="button"
                  onClick={abrirHistorico}
                  className="rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:text-ink"
                >
                  Histórico
                </button>
                {/* M42: duplica como rascunho sem data; pede nova data */}
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      const r = await duplicarPost(open.id);
                      setMsg(
                        r.ok
                          ? { kind: "ok", text: `Cópia criada como rascunho${r.parecidos ? ` · ${r.parecidos} parecido(s) já existe(m)` : ""}. Escolha uma nova data.` }
                          : { kind: "err", text: r.error },
                      );
                      router.refresh();
                    })
                  }
                  className="min-h-11 rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:text-ink md:min-h-0"
                >
                  Duplicar
                </button>
              </div>
              {/* M41: comentarios de revisao presos ao trecho */}
              <div className="space-y-2 rounded-md border border-line p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-faint">Trecho: {selTrecho ? `“${selTrecho.slice(0, 60)}”` : "selecione um trecho da legenda"}</span>
                </div>
                <div className="flex gap-2">
                  <input value={comTexto} onChange={(e) => setComTexto(e.target.value)} placeholder="comentário sobre o trecho" className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-panel2 px-2 text-sm text-ink" />
                  <button
                    type="button"
                    disabled={!selTrecho || !comTexto.trim()}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await comentarTrecho(open.id, selTrecho, comTexto);
                        if (r.ok) {
                          setComTexto("");
                          setComs(await listarComentarios(open.id));
                        } else setMsg({ kind: "err", text: r.error });
                      })
                    }
                    className="min-h-11 shrink-0 rounded-md border border-line px-3 text-dim disabled:opacity-40"
                  >
                    Comentar trecho
                  </button>
                </div>
                <button type="button" onClick={async () => setComs(await listarComentarios(open.id))} className="text-info hover:underline">
                  ver comentários
                </button>
                {coms && (
                  <ul className="space-y-2">
                    {coms.length === 0 && <li className="text-faint">Nenhum comentário ainda.</li>}
                    {coms.map((c) => (
                      <li key={c.quando} className={`rounded-md border border-line p-2 ${c.resolvido ? "opacity-50" : ""}`}>
                        <div className="text-faint">“{c.trecho}”</div>
                        <div className="text-dim">{c.texto}</div>
                        {!c.resolvido && (
                          <button
                            type="button"
                            onClick={() =>
                              startTransition(async () => {
                                await resolverComentario(open.id, c.quando);
                                setComs(await listarComentarios(open.id));
                              })
                            }
                            className="mt-1 min-h-11 text-info hover:underline md:min-h-0"
                          >
                            Resolver
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* D09: Instagram e LinkedIn lado a lado, cada um com o texto proprio */}
              <div className="grid gap-3 text-xs sm:grid-cols-2">
                {(["instagram", "linkedin"] as const).map((rd) => {
                  const base = adaptar(open.legenda ?? "", open.hashtags ?? [], rd);
                  const atual = versoes[rd] ?? base.body;
                  const limite = REDES[rd].limite;
                  const contaLi = Boolean((byId.get(open.brand_id) as { linkedin_org_id?: string | null } | undefined)?.linkedin_org_id);
                  const aguarda = rd === "linkedin" && !contaLi;
                  return (
                    <div key={rd} className="space-y-2 rounded-md border border-line p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-dim">{REDES[rd].nome}</span>
                        <span className={aguarda ? "text-warn" : "text-ok"}>{aguarda ? "a confirmar" : "pronta"}</span>
                      </div>
                      <textarea
                        value={atual}
                        onChange={(e) => setVersoes((v) => ({ ...v, [rd]: e.target.value }))}
                        rows={6}
                        className="w-full rounded-md border border-line bg-panel2 px-2 py-1.5 text-xs text-ink outline-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className={atual.length > limite ? "text-bad" : "text-faint"}>{atual.length}/{limite}</span>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await salvarVersaoRede(open.id, rd, atual);
                              setMsg(r.ok ? { kind: "ok", text: `Versão do ${REDES[rd].nome} salva.` } : { kind: "err", text: r.error });
                            })
                          }
                          className="min-h-11 rounded-md border border-line px-3 text-dim hover:text-ink md:min-h-0"
                        >
                          Salvar versão
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hist !== null && (
                <ul className="space-y-1.5 rounded-md border border-line p-2 text-xs">
                  {hist.length === 0 ? (
                    <li className="text-faint">Nenhuma versão anterior ainda.</li>
                  ) : (
                    hist.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 truncate text-dim">{h}</span>
                        <button type="button" onClick={() => setLegDraft(h)} className="shrink-0 text-info hover:underline">
                          usar
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* D09: prévia, estado e próximo passo a direita */}
            <div className={`${abaMob === "midia" ? "flex" : "hidden"} flex-col gap-4 sm:flex`}>
            {/* preview IG */}
            <InstagramPreview
              username={byId.get(open.brand_id)?.slug ?? "?"}
              cor={byId.get(open.brand_id)?.cor_principal ?? "#000"}
              picture={byId.get(open.brand_id)?.avatar}
              media={open.media}
              legenda={open.legenda}
              hashtags={open.hashtags}
              tipo={open.tipo}
              time={open.scheduled_at ? fmtDate(open.scheduled_at) : undefined}
            />

            {/* metadados */}
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <StatusBadge status={open.status} />
                <button onClick={() => setOpenId(null)} className="text-xs text-faint hover:text-dim">
                  fechar ✕
                </button>
              </div>

              {/* o passo que falta pra ESTE post, dito em uma linha */}
              <p
                className={`rounded-md border px-3 py-2 text-xs leading-snug ${
                  semArte(open)
                    ? "border-warn/30 bg-warn/5 text-warn"
                    : "border-line bg-panel/60 text-dim"
                }`}
              >
                {semArte(open)
                  ? "Próximo passo: gerar a imagem com o prompt abaixo (dá pra editar antes)."
                  : open.status === "draft"
                    ? "Próximo passo: revisar a legenda e clicar em Aprovar."
                    : open.status === "approved" || open.status === "scheduled"
                      ? "Próximo passo: clicar em Publicar agora (ou aguardar o horário agendado)."
                      : open.status === "published"
                        ? "Esse post já está no ar."
                        : "A publicação falhou. Confira a conexão da marca em Marcas e tente de novo."}
              </p>

              <Meta k="Marca" v={byId.get(open.brand_id)?.nome ?? "?"} />
              <Meta k="Tipo" v={`${TIPO[open.tipo] ?? open.tipo} · ${FORMATO[open.formato] ?? open.formato}`} />
              <Meta k="Origem" v={open.origem === "auto" ? "gerado pelo time (automático)" : "manual"} />
              {open.analista && <Meta k="Criado por" v={open.analista} />}
              {open.fonte_tipo && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-faint">Inspirado em</div>
                  <div className="mt-0.5 text-dim">
                    {open.fonte_tipo === "noticia" ? "notícia" : "concorrente"}
                    {open.fonte_url && (
                      <>
                        {" · "}
                        <a href={open.fonte_url} target="_blank" rel="noreferrer" className="text-info hover:underline">
                          ver original ↗
                        </a>
                      </>
                    )}
                  </div>
                  {open.fonte_label && <div className="mt-0.5 line-clamp-2 text-[11px] text-faint">{open.fonte_label}</div>}
                </div>
              )}

              {/* prompt da imagem: editável, com o botão que gera a arte */}
              <div>
                <label htmlFor="prompt-img" className="block text-[11px] uppercase tracking-wide text-faint">
                  Prompt da imagem
                </label>
                <textarea
                  id="prompt-img"
                  value={promptDraft}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  rows={3}
                  placeholder="Descreva a arte (ex: mesa de escritório minimalista, luz natural, sem texto)"
                  className="mt-1 w-full rounded-md border border-line bg-panel2 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint focus:border-line2"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => gerarArte(open.id, promptDraft)}
                    disabled={genId !== null || !promptDraft.trim()}
                    className="rounded-md border border-warn/40 px-3 py-1.5 text-xs text-warn transition-colors hover:bg-warn/10 disabled:opacity-40"
                  >
                    {genId === open.id
                      ? "gerando… (leva ~40s)"
                      : open.media.length
                        ? "Gerar outra imagem"
                        : "Gerar imagem"}
                  </button>
                  <span className="text-[11px] text-faint">a arte fica salva no post e na Biblioteca</span>
                </div>
              </div>

              {/* M47: carrossel com a ordem dos slides; setas reordenam */}
              {open.tipo === "carousel" && open.media.length > 1 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide text-faint">Ordem dos slides</div>
                  <ol className="flex gap-2 overflow-x-auto pb-1">
                    {open.media.map((url, i) => (
                      <li key={url} className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-16 w-16 rounded-md border border-line object-cover" />
                        <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">{i + 1}</span>
                        <div className="mt-1 flex justify-between">
                          <button
                            type="button"
                            disabled={i === 0}
                            aria-label="Mover para antes"
                            onClick={() => reordenarSlide(i, i - 1)}
                            className="min-h-11 min-w-11 text-sm text-dim disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={i === open.media.length - 1}
                            aria-label="Mover para depois"
                            onClick={() => reordenarSlide(i, i + 1)}
                            className="min-h-11 min-w-11 text-sm text-dim disabled:opacity-30"
                          >
                            →
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* M27: falha em linguagem simples, com a acao principal e os detalhes recolhidos */}
              {open.status === "failed" && (
                <div className="rounded-md border border-bad/40 bg-bad/5 p-3 text-sm">
                  <p className="text-ink">
                    {/token|conta|conect|permiss/i.test(open.erro ?? "")
                      ? "Não saiu: a conta precisa ser reconectada antes de publicar."
                      : `Não saiu${open.erro ? `: ${open.erro}` : ", motivo não registrado"}.`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/marcas/${byId.get(open.brand_id)?.slug ?? ""}/conectar`} className="min-h-11 rounded-md border border-line px-3 py-2 text-xs text-dim hover:text-ink md:min-h-0">
                      Reconectar conta
                    </Link>
                    <button type="button" onClick={() => confirmarPublicar(open, () => act(publishPostAction, open.id, "Publicado no Instagram."))} className="min-h-11 rounded-md border border-line px-3 py-2 text-xs text-dim hover:text-ink md:min-h-0">
                      Tentar de novo
                    </button>
                  </div>
                  <details className="mt-2 text-xs text-faint">
                    <summary className="cursor-pointer">Detalhes técnicos</summary>
                    <pre className="mt-1 whitespace-pre-wrap break-words">{open.erro ?? "sem detalhes"}</pre>
                  </details>
                </div>
              )}

              {/* D45: linha do tempo do post, com o resultado em uma frase */}
              <div className="rounded-md border border-line bg-panel/60 px-3 py-2 text-xs">
                <div className="mb-1 text-[11px] uppercase tracking-wide text-faint">Linha do tempo</div>
                <ol className="space-y-0.5 text-dim">
                  <li>Criado em {fmtDate(open.created_at)}</li>
                  {open.scheduled_at && <li>Agendado para {fmtDate(open.scheduled_at)}</li>}
                  {open.status === "approved" && <li>Aprovado</li>}
                  {open.status === "published" && <li>Publicado em {fmtDate(open.updated_at)}</li>}
                  {open.status === "failed" && <li>Falhou em {fmtDate(open.updated_at)}</li>}
                </ol>
                <p className="mt-1.5 text-ink">{resultadoFrase(open)}</p>
              </div>

              {/* D43: diagnostico do post, o que impede de sair */}
              <div className="rounded-md border border-line bg-panel/60 px-3 py-2 text-xs">
                <div className="mb-1 text-[11px] uppercase tracking-wide text-faint">Diagnóstico</div>
                <ul className="space-y-0.5">
                  <li className={open.media.length > 0 ? "text-ok" : "text-warn"}>
                    {open.media.length > 0 ? "✓" : "○"} Mídia {open.media.length > 0 ? `(${open.media.length})` : "faltando: gere a imagem"}
                  </li>
                  <li className={open.legenda.trim() ? "text-ok" : "text-warn"}>
                    {open.legenda.trim() ? "✓" : "○"} Legenda {open.legenda.trim() ? `(${open.legenda.trim().length} caracteres)` : "vazia"}
                  </li>
                  <li className={open.scheduled_at ? "text-ok" : "text-dim"}>
                    {open.scheduled_at ? "✓" : "○"} Horário {open.scheduled_at ? fmtDate(open.scheduled_at) : "sem data (fica como rascunho)"}
                  </li>
                  <li className={open.status === "failed" ? "text-bad" : "text-dim"}>
                    {open.status === "failed" ? "✕" : "•"} Último erro: {open.erro ? open.erro : "nenhum"}
                  </li>
                </ul>
              </div>
              {open.scheduled_at && <Meta k="Agendado" v={fmtDate(open.scheduled_at)} />}
              {open.external_url && (
                <a href={open.external_url} target="_blank" rel="noreferrer" className="text-xs text-info hover:underline">
                  ver publicado no Instagram ↗
                </a>
              )}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
                {open.status === "draft" && (
                  <button
                    onClick={() => act(approvePost, open.id, "Post aprovado. Já dá pra publicar.")}
                    disabled={pending || open.media.length === 0}
                    title={open.media.length === 0 ? "gere a imagem antes de aprovar" : undefined}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:border-ok/50 hover:text-ok disabled:opacity-40"
                  >
                    Aprovar
                  </button>
                )}
                {(open.status === "approved" || open.status === "scheduled") && (
                  <button
                    onClick={() => { confirmarPublicar(open, () => act(publishPostAction, open.id, "Publicado no Instagram.")); }}
                    disabled={pending}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:border-info/50 hover:text-info disabled:opacity-50"
                  >
                    Publicar agora
                  </button>
                )}
                <Link href="/criar" className="rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:text-ink">
                  Criar novo
                </Link>
                <button
                  onClick={() => {
                    act(removePost, open.id);
                    setOpenId(null);
                  }}
                  disabled={pending}
                  className="rounded-md border border-line px-3 py-1.5 text-xs text-faint hover:border-bad/50 hover:text-bad disabled:opacity-50"
                >
                  Excluir
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-faint">{k}</div>
      <div className="mt-0.5 text-dim">{v}</div>
    </div>
  );
}
