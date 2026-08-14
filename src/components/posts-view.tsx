"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Post, Analytics } from "@/server/posts";
import { approvePost, publishPostAction, removePost } from "@/app/(app)/posts/actions";
import { StatusBadge } from "@/components/ui";
import { InstagramPreview } from "@/components/instagram-preview";
import { TIPO, FORMATO, STATUS, fmtDate, type StatusKey } from "@/lib/ui";

type BrandLite = { id: string; slug: string; nome: string; cor_principal: string };
const STATUS_ORDER: StatusKey[] = ["draft", "approved", "scheduled", "published", "failed"];

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
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
          count ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
        }`}
      >
        {label} {count > 0 && <span className="text-info">({count})</span>}
        <span className="text-faint">▾</span>
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

export function PostsView({
  posts,
  brands,
  analytics,
}: {
  posts: Post[];
  brands: BrandLite[];
  analytics: Analytics;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"list" | "grade">("list");
  const [brandSel, setBrandSel] = useState<Set<string>>(new Set());
  const [statusSel, setStatusSel] = useState<Set<string>>(new Set());
  const [analistaSel, setAnalistaSel] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [showRank, setShowRank] = useState(false);

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

  const filtered = posts.filter(
    (p) =>
      (brandSel.size === 0 || brandSel.has(p.brand_id)) &&
      (statusSel.size === 0 || statusSel.has(p.status)) &&
      (analistaSel.size === 0 || (p.analista ? analistaSel.has(p.analista) : false))
  );

  const act = (fn: (id: string) => Promise<void>, id: string) =>
    startTransition(async () => {
      await fn(id);
      router.refresh();
    });

  const open = openId ? posts.find((p) => p.id === openId) ?? null : null;

  return (
    <div>
      {/* filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
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

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRank((s) => !s)}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-dim transition-colors hover:text-ink"
          >
            Ranking do time
          </button>
          <div className="inline-flex rounded-md border border-line p-0.5">
            {(["list", "grade"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  view === v ? "bg-panel2 text-ink" : "text-dim hover:text-ink"
                }`}
              >
                {v === "list" ? "Lista" : "Grade"}
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

      <p className="mb-3 text-xs text-faint">
        {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        {pending && " · atualizando…"}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-panel/30 px-4 py-10 text-center text-sm text-faint">
          Nenhum post com esses filtros.
        </p>
      ) : view === "grade" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const b = byId.get(p.brand_id);
            const st = STATUS[p.status as StatusKey];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpenId(p.id)}
                title={p.legenda}
                className="block text-left transition-transform hover:-translate-y-0.5"
              >
                <InstagramPreview
                  compact
                  username={b?.slug ?? "?"}
                  cor={b?.cor_principal ?? "#000"}
                  media={p.media}
                  legenda={p.legenda}
                  hashtags={p.hashtags}
                  badge={
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-1.5 py-0.5 text-[10px] text-dim">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st?.dot ?? "#888" }} />
                      {st?.label ?? p.status}
                    </span>
                  }
                />
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const b = byId.get(p.brand_id);
            return (
              <li
                key={p.id}
                className="relative flex items-center gap-4 overflow-hidden rounded-lg border border-line bg-panel py-3 pl-5 pr-4"
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ background: b?.cor_principal ?? "#3a3a40" }} />
                <button
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-panel2"
                >
                  {p.media[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.media[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] text-faint">sem mídia</span>
                  )}
                </button>

                <button type="button" onClick={() => setOpenId(p.id)} className="min-w-0 flex-1 text-left">
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
                    {p.status === "draft" && (
                      <button
                        onClick={() => act(approvePost, p.id)}
                        disabled={pending}
                        className="rounded-md border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:border-ok/50 hover:text-ok disabled:opacity-50"
                      >
                        Aprovar
                      </button>
                    )}
                    {(p.status === "approved" || p.status === "scheduled") && (
                      <button
                        onClick={() => act(publishPostAction, p.id)}
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
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/70 p-4 sm:p-8"
          onClick={() => setOpenId(null)}
        >
          <div
            className="grid w-full max-w-3xl gap-6 rounded-xl border border-line bg-canvas p-5 sm:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* preview IG */}
            <InstagramPreview
              username={byId.get(open.brand_id)?.slug ?? "?"}
              cor={byId.get(open.brand_id)?.cor_principal ?? "#000"}
              media={open.media}
              legenda={open.legenda}
              hashtags={open.hashtags}
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
              {open.imagem_prompt && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-faint">Prompt da imagem</div>
                  <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-faint">{open.imagem_prompt}</p>
                </div>
              )}
              {open.scheduled_at && <Meta k="Agendado" v={fmtDate(open.scheduled_at)} />}
              {open.external_url && (
                <a href={open.external_url} target="_blank" rel="noreferrer" className="text-xs text-info hover:underline">
                  ver publicado no Instagram ↗
                </a>
              )}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-line pt-3">
                {open.status === "draft" && (
                  <button
                    onClick={() => act(approvePost, open.id)}
                    disabled={pending}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:border-ok/50 hover:text-ok disabled:opacity-50"
                  >
                    Aprovar
                  </button>
                )}
                {(open.status === "approved" || open.status === "scheduled") && (
                  <button
                    onClick={() => act(publishPostAction, open.id)}
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
