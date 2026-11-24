"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { avisar } from "@/components/avisos";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Post } from "@/server/posts";
import { approvePost, postponePost } from "@/app/(app)/posts/actions";
import { pedirAjustePost } from "@/app/(app)/aprovacao/actions";
import { InstagramPreview } from "@/components/instagram-preview";
import { btnPrimary, btnGhost } from "@/components/ui";
import { TIPO, FORMATO, fmtDate } from "@/lib/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string; avatar: string | null };

// D11: contagem regressiva ate a publicacao, em texto curto.
function faltam(iso: string | null, agora: number): string {
  if (!iso) return "sem horário";
  const diff = new Date(iso).getTime() - agora;
  if (diff < 0) return "atrasado";
  const min = Math.round(diff / 60000);
  if (min < 60) return `sai em ${min}min`;
  if (min < 24 * 60) return `sai em ${Math.floor(min / 60)}h ${min % 60}min`;
  return `sai ${fmtDate(iso)}`;
}

export function ApprovalQueue({ posts, brands }: { posts: Post[]; brands: BrandLite[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [idx, setIdx] = useState(0);
  const [comentario, setComentario] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  const byId = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  // marcas sem rascunho entram no fim, e a última linha (se incompleta) é centralizada no desktop
  const vazias = brands.filter((br) => !posts.some((p) => p.brand_id === br.id));
  const totalCartoes = posts.length + vazias.length;
  const resto = totalCartoes % 3;
  const inicioUltimaLinha = resto === 0 ? -1 : totalCartoes - resto;
  const deslocar = (i: number) => (i !== inicioUltimaLinha ? "" : resto === 2 ? "xl:col-start-2" : "xl:col-start-3");
  const atual = posts[Math.min(idx, posts.length - 1)];
  const b = byId.get(atual.brand_id);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // teclado: setas trocam de item, A aprova (fora de campos de texto)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      if (alvo && (alvo.tagName === "TEXTAREA" || alvo.tagName === "INPUT")) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, posts.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key.toLowerCase() === "a") {
        aprovar();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length, atual?.id]);

  function aprovar() {
    startTransition(async () => {
      const r = await approvePost(atual.id);
      setMsg(r.ok ? { kind: "ok", text: "Aprovado. Sai no horário marcado." } : { kind: "err", text: r.error });
      avisar(r.ok ? "ok" : "erro", r.ok ? "Aprovado. Sai no horário marcado." : r.error);
      router.refresh();
    });
  }

  function adiar() {
    startTransition(async () => {
      const r = await postponePost(atual.id);
      setMsg(r.ok ? { kind: "ok", text: "Adiado para o mesmo horário de amanhã." } : { kind: "err", text: r.error });
      avisar(r.ok ? "ok" : "erro", r.ok ? "Adiado para o mesmo horário de amanhã." : r.error);
      router.refresh();
    });
  }

  // D11: o pedido de ajuste e salvo no post
  function pedirAjuste() {
    startTransition(async () => {
      const r = await pedirAjustePost(atual.id, comentario);
      if (r.ok) {
        setMsg({ kind: "ok", text: "Ajuste pedido e salvo no post." });
        avisar("ok", "Ajuste pedido e salvo no post.");
        setComentario("");
      } else {
        setMsg({ kind: "err", text: r.error });
        avisar("erro", r.error);
      }
      router.refresh();
    });
  }

  const hashtags = (atual.legenda.match(/#\w+/g) ?? []).length;
  const checks = [
    { ok: Boolean(b), texto: `Marca ${b?.nome ?? "?"} conferida` },
    { ok: atual.media.length > 0, texto: `Mídia anexada (${atual.media.length})` },
    { ok: atual.legenda.trim().length > 0, texto: `Legenda com ${hashtags} hashtag(s)` },
  ];

  // M03: no celular a fila e o painel alternam: um post por vez
  const [mobileLista, setMobileLista] = useState(true);
  // M03: gesto no painel. Deslizar para a direita aprova; para a esquerda adia.
  const toque = useRef<number | null>(null);

  // D11: no desktop, a revisao sao cartoes lado a lado; cada um com a previa e a sua decisao
  const aprovarTodos = () =>
    startTransition(async () => {
      let ok = 0;
      for (const p of posts) {
        if (p.media.length === 0) continue;
        const r = await approvePost(p.id);
        if (r.ok) ok++;
      }
      setMsg({ kind: "ok", text: `${ok} post(s) aprovado(s).` });
      avisar("ok", `${ok} post(s) aprovado(s).`);
      router.refresh();
    });
  const decidir = (id: string, acao: "aprovar" | "adiar") =>
    startTransition(async () => {
      const r = acao === "aprovar" ? await approvePost(id) : await postponePost(id);
      setMsg(r.ok ? { kind: "ok", text: acao === "aprovar" ? "Post aprovado." : "Adiado para amanhã." } : { kind: "err", text: r.error });
      avisar(r.ok ? "ok" : "erro", r.ok ? acao === "aprovar" ? "Post aprovado." : "Adiado para amanhã." : r.error);
      router.refresh();
    });

  return (
    <>
      <div className="hidden lg:block">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-dim">{posts.length} peça(s) aguardam revisão</p>
          <button type="button" onClick={aprovarTodos} disabled={pending || posts.length === 0} className="min-h-11 rounded-md border border-line px-4 text-sm text-dim hover:text-ink disabled:opacity-40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12.5l4 4 6-7M12 16.5l1 1 8-9" /></svg>
            Aprovar as {posts.filter((p) => p.media.length > 0).length}
          </button>
        </div>
        <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-6">
          {posts.map((p, i) => {
            const pb = byId.get(p.brand_id);
            const comArte = p.media.length > 0;
            return (
              <div key={p.id} className={`min-h-[560px] min-w-0 flex flex-col gap-3 rounded-xl border p-3 xl:col-span-2 border-line bg-panel ${deslocar(i)}`}>
                <div className="flex items-center justify-between gap-2 text-xs text-faint">
                  <span className="truncate">{pb?.nome ?? "?"}</span>
                  <span className="shrink-0">{faltam(p.scheduled_at, agora)}</span>
                </div>
                <div className={`flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-xs ${comArte ? "bg-ok/10 text-ok" : "border border-warn/40 bg-warn/10 text-warn"}`}>
                  <span>{comArte ? "Arte pronta" : "Sem arte ainda"}</span>
                  {comArte ? null : (
                    <Link href="/posts" className="inline-flex items-center gap-1 font-medium hover:underline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3 w-3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /></svg>
                      Gerar arte
                    </Link>
                  )}
                </div>
                <div className="flex-1">
                  <InstagramPreview
                    compact
                    username={pb?.slug ?? "?"}
                    cor={pb?.cor_principal ?? "#000"}
                    picture={pb?.avatar}
                    media={p.media}
                    legenda={p.legenda}
                    hashtags={p.hashtags}
                    tipo={p.tipo}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <Link href="/posts" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-line px-2 text-center text-dim hover:text-ink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z" /></svg>Ajustar</Link>
                  <button type="button" onClick={() => decidir(p.id, "adiar")} disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-line px-2 text-dim hover:text-ink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>Adiar</button>
                  <button type="button" onClick={() => decidir(p.id, "aprovar")} disabled={pending || !comArte} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-ink px-2 font-medium text-canvas disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 12.5 3.5 3.5 7.5-8" /></svg>Aprovar</button>
                </div>
              </div>
            );
          })}
          {vazias.map((br, k) => (
            <div key={br.id} className={`min-h-[560px] min-w-0 flex flex-col gap-3 rounded-xl border p-3 xl:col-span-2 border-dashed border-line bg-panel/40 ${deslocar(posts.length + k)}`}>
              <div className="flex items-center justify-between gap-2 text-xs text-faint">
                <span className="truncate">{br.nome}</span>
                <span className="shrink-0">sem horário</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-line px-3 py-1.5 text-xs text-faint">
                <span>Sem rascunho</span>
              </div>
              <div className="flex-1">
                <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-panel2/60 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full text-base font-semibold text-canvas" style={{ background: br.cor_principal }}>{br.nome.charAt(0)}</span>
                  <span className="px-4 text-xs text-faint">Nenhum rascunho para revisar</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-2 text-faint opacity-50">Ajustar</span>
                <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-2 text-faint opacity-50">Adiar</span>
                <Link href="/criar" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-line px-2 text-dim hover:text-ink"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-3.5 w-3.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>Criar</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:hidden">
      {/* fila por prazo */}
      <section className={mobileLista ? "" : "hidden lg:block"}>
        <p className="mb-2 hidden text-[11px] text-faint md:block">Setas ↑↓ para trocar de item · A para aprovar</p>
        <ul className="space-y-1.5">
          {posts.map((p, i) => {
            const pb = byId.get(p.brand_id);
            const ativo = i === idx;
            const urgente = faltam(p.scheduled_at, agora) === "atrasado";
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileLista(false);
                    setIdx(i);
                    setMsg(null);
                    setComentario("");
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    ativo ? "border-line2 bg-panel2" : "border-line bg-panel hover:border-line2"
                  }`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pb?.cor_principal ?? "#888" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{p.legenda?.trim() || "(sem legenda)"}</span>
                    <span className="block truncate text-[11px] text-faint">
                      {pb?.nome ?? "?"} · {TIPO[p.tipo] ?? p.tipo}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xs ${urgente ? "text-bad" : "text-warn"}`}>
                    {faltam(p.scheduled_at, agora)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* painel de decisao */}
      <section
        onTouchStart={(e) => {
          toque.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const x0 = toque.current;
          toque.current = null;
          if (x0 === null) return;
          const dx = e.changedTouches[0].clientX - x0;
          if (dx > 80) aprovar();
          else if (dx < -80) adiar();
        }}
        className={`space-y-4 rounded-xl border border-line bg-panel p-4 ${mobileLista ? "hidden lg:block" : ""}`}
      >
        <div className="flex items-center justify-between lg:hidden">
          <button type="button" onClick={() => setMobileLista(true)} className="min-h-11 px-2 text-sm text-info">← Fila</button>
          <span className="text-xs text-faint">Revisão {idx + 1} de {posts.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-faint">
          <span>
            {TIPO[atual.tipo] ?? atual.tipo} · {FORMATO[atual.formato] ?? atual.formato}
          </span>
          <span>
            {idx + 1} de {posts.length}
          </span>
        </div>

        <InstagramPreview
          username={b?.slug ?? "?"}
          cor={b?.cor_principal ?? "#000"}
          picture={b?.avatar}
          media={atual.media}
          legenda={atual.legenda}
          hashtags={atual.hashtags}
          tipo={atual.tipo}
          time={atual.scheduled_at ? fmtDate(atual.scheduled_at) : undefined}
        />

        <div>
          <div className="text-[11px] uppercase tracking-wide text-faint">Checagens</div>
          <ul className="mt-1 space-y-1 text-xs">
            {checks.map((c) => (
              <li key={c.texto} className={c.ok ? "text-ok" : "text-warn"}>
                {c.ok ? "✓" : "○"} {c.texto}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label htmlFor="comentario-ajuste" className="block text-[11px] uppercase tracking-wide text-faint">
            Comentário para quem editou (opcional)
          </label>
          <textarea
            id="comentario-ajuste"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm text-ink outline-none focus:border-line2"
          />
        </div>

        {msg && (
          <p className={`rounded-md border px-3 py-2 text-xs ${msg.kind === "ok" ? "border-ok/30 text-ok" : "border-bad/30 text-bad"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button type="button" onClick={adiar} disabled={pending} className={btnGhost}>
            Adiar para amanhã
          </button>
          <button type="button" onClick={pedirAjuste} disabled={pending} className={btnGhost}>
            Pedir ajuste
          </button>
          <button
            type="button"
            onClick={aprovar}
            disabled={pending || atual.media.length === 0}
            className={`${btnPrimary} ml-auto`}
          >
            Aprovar · A
          </button>
        </div>
      </section>
      </div>
    </>
  );
}
