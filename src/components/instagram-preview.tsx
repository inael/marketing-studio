"use client";

import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";

type Props = {
  username: string;
  cor: string;
  picture?: string | null;
  media: string[];
  legenda: string;
  hashtags?: string[];
  likes?: number;
  comments?: number;
  time?: string;
  compact?: boolean;
  badge?: ReactNode;
  tipo?: string;
};

/** Simula o card de um post no Instagram (claro/escuro conforme o tema do app,
 *  igual ao próprio IG que tem os dois modos). Reusado no Criar e no detalhe. */
export function InstagramPreview({
  username,
  cor,
  picture,
  media,
  legenda,
  hashtags = [],
  likes,
  comments,
  time,
  compact,
  badge,
  tipo,
}: Props) {
  const multi = media.length > 1;
  const tags = hashtags.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [vista, setVista] = useState<"feed" | "grade" | "story">("feed");
  // M06: a legenda corta como no celular do publico; "mais" expande
  const [expandida, setExpandida] = useState(false);
  // M46: reel em tela cheia 9:16 com as zonas que a interface da rede cobre
  const [telaCheia, setTelaCheia] = useState(false);
  // D10: proporcao real da imagem (medida ao carregar): avisa se o feed vai cortar
  const [razao, setRazao] = useState<number | null>(null);
  const avisoCorte = razao === null || tipo === "reel" ? null : razao < 0.8 ? "o feed vai cortar as laterais (mais alta que 4:5)" : razao > 1.91 ? "o feed vai cortar em cima e embaixo (mais larga que 1,91:1)" : null;
  const [zona, setZona] = useState<"topo" | "base" | null>(null);
  const cur = media.length ? Math.min(idx, media.length - 1) : 0;
  const go = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => Math.max(0, Math.min(media.length - 1, i + delta)));
  };

  // D10: abas Feed / Grade / Story, como o post aparece em cada lugar do Instagram
  const tabsBar = (
    <div role="tablist" aria-label="Visualização" className="flex gap-0.5 rounded-md bg-panel2 p-0.5">
      {(["feed", "grade", "story"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={vista === v}
          onClick={(e) => {
            e.stopPropagation();
            setVista(v);
          }}
          className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
            vista === v ? "bg-panel text-ink" : "text-faint hover:text-dim"
          }`}
        >
          {v === "feed" ? "Feed" : v === "grade" ? "Grade" : "Story"}
        </button>
      ))}
    </div>
  );

  if (!compact && vista === "grade") {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="border-b border-line px-3 py-1.5">{tabsBar}</div>
        <div className="grid grid-cols-3 gap-px bg-line">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="aspect-square bg-panel2">
              {k === 0 && media[cur] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media[cur]} alt="" onLoad={(e) => setRazao(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
        <p className="px-3 py-2 text-[11px] text-faint">Na grade do perfil: a primeira casa é este post.</p>
      </div>
    );
  }

  if (!compact && vista === "story") {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="border-b border-line px-3 py-1.5">{tabsBar}</div>
        <div className="relative aspect-[9/16] bg-black">
          {media[cur] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media[cur]} alt="" onLoad={(e) => setRazao(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-faint">sua imagem aparece aqui</div>
          )}
          <div className="absolute inset-x-2 top-2 h-0.5 overflow-hidden rounded bg-white/35">
            <div className="h-full w-1/3 bg-white" />
          </div>
          <div className="absolute left-2 top-4 flex items-center gap-2">
            <Avatar src={picture} nome={username} cor={cor} size={28} ring />
            <span className="text-[12px] font-semibold text-white drop-shadow">{username}</span>
          </div>
          {legenda && (
            <p className="absolute inset-x-3 bottom-4 line-clamp-3 text-[13px] text-white drop-shadow">{legenda}</p>
          )}
        </div>
      </div>
    );
  }

  if (telaCheia) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setTelaCheia(false)}>
        <div className="relative aspect-[9/16] h-full max-h-[90vh] overflow-hidden rounded-lg bg-black" onClick={(e) => e.stopPropagation()}>
          {media[cur] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media[cur]} alt="" onLoad={(e) => setRazao(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-xs text-faint">sua imagem aparece aqui</div>
          )}
          <button
            type="button"
            onClick={() => setZona(zona === "topo" ? null : "topo")}
            className="absolute inset-x-0 top-0 h-[14%] bg-red-500/25 text-left text-[11px] text-white"
          >
            <span className="px-2 pt-1 block">{zona === "topo" ? "o topo mostra o nome da conta e o áudio: não coloque texto aqui" : ""}</span>
          </button>
          <button
            type="button"
            onClick={() => setZona(zona === "base" ? null : "base")}
            className="absolute inset-x-0 bottom-0 h-[28%] bg-red-500/25 text-left text-[11px] text-white"
          >
            <span className="block px-2 pb-1 mt-auto">{zona === "base" ? "a base mostra a legenda e os botões: deixe o texto acima dela" : ""}</span>
          </button>
          <button type="button" onClick={() => setTelaCheia(false)} className="absolute right-2 top-2 min-h-11 min-w-11 rounded-full bg-black/60 text-white" aria-label="Fechar">×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      {/* D10: faixa com o formato e o aviso de corte, como o público vê */}
      {!compact && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5 text-[10px] text-faint">
          {tabsBar}
          <span className="truncate">
            {avisoCorte ? avisoCorte : tipo === "reel" ? "capa pode cortar o texto da borda" : multi ? "slides deslizam na ordem" : "sem corte da imagem"}
          </span>
        </div>
      )}
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar src={picture} nome={username} cor={cor} size={32} ring />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-ink">
          {username}
        </span>
        {badge}
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-dim">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </div>

      {/* imagem (proporção conforme o tipo: reel = vertical 9:16) */}
      <div className={`relative w-full bg-panel2 ${tipo === "reel" ? "aspect-[9/16]" : "aspect-square"}`}>
        {media[cur] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media[cur]} alt="" onLoad={(e) => setRazao(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-faint">
            {tipo === "reel" ? "seu reel aparece aqui" : "sua imagem aparece aqui"}
          </div>
        )}

        {tipo === "reel" && (
          <span className="absolute right-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            REEL
          </span>
        )}
        {tipo === "reel" && !compact && (
          <button type="button" onClick={() => setTelaCheia(true)} className="absolute left-2 bottom-2 min-h-11 rounded-md bg-black/55 px-3 text-[11px] text-white">
            Tela cheia 9:16
          </button>
        )}
        {multi && tipo !== "reel" && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
            {cur + 1}/{media.length}
          </span>
        )}

        {/* setas do carrossel (não no modo compacto da grade) */}
        {multi && !compact && (
          <>
            {cur > 0 && (
              <button
                type="button"
                onClick={go(-1)}
                aria-label="Anterior"
                className="absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
              >
                ‹
              </button>
            )}
            {cur < media.length - 1 && (
              <button
                type="button"
                onClick={go(1)}
                aria-label="Próxima"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
              >
                ›
              </button>
            )}
          </>
        )}

        {multi && tipo !== "reel" && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {media.slice(0, 8).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === cur ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ações */}
      <div className="flex items-center gap-4 px-3 pt-3 text-ink">
        <Icon label="Curtir" d="M12 21s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c2 0 3.5 1.3 4.5 3 1-1.7 2.5-3 4.5-3 3 0 4.5 3 3 6C19 16.65 12 21 12 21z" />
        <Icon label="Comentar" d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" />
        <Icon label="Enviar" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
        <Icon label="Salvar" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" className="ml-auto" />
      </div>

      {/* curtidas */}
      {typeof likes === "number" && (
        <div className="px-3 pt-2 text-[13px] font-semibold text-ink">
          {likes.toLocaleString("pt-BR")} curtidas
        </div>
      )}

      {/* legenda */}
      <div
        className={`px-3 ${typeof likes === "number" ? "pt-1" : "pt-2"} ${
          compact ? "min-h-[2.75rem] pb-1" : ""
        } text-[13px] leading-snug`}
      >
        {legenda || tags.length > 0 ? (
          <>
          <p className={`whitespace-pre-wrap break-words text-ink ${expandida ? "" : "line-clamp-2"}`}>
            <span className="font-semibold">{username} </span>
            {legenda}
            {tags.length > 0 && (
              <span className="text-info"> {tags.map((t) => `#${t}`).join(" ")}</span>
            )}
          </p>
          {!expandida && (legenda.length > 90 || tags.length > 0) && (
            <button type="button" onClick={() => setExpandida(true)} className="text-[13px] text-faint hover:text-dim">mais</button>
          )}
          </>
        ) : (
          <p className="text-faint">a legenda aparece aqui</p>
        )}
      </div>

      {typeof comments === "number" && comments > 0 && (
        <div className="px-3 pt-1 text-[13px] text-faint">Ver todos os {comments} comentários</div>
      )}
      {time && (
        <div className="px-3 pt-1 text-[10px] uppercase tracking-wide text-faint">{time}</div>
      )}

      {!compact && (
        <div className="mt-2 flex items-center gap-2 border-t border-line px-3 py-2.5 text-[13px] text-faint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
            <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
            <path d="M8.5 14.5a4 4 0 0 0 7 0M9 10h.01M15 10h.01" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="flex-1">Adicionar um comentário…</span>
          <span className="font-semibold text-info/50">Publicar</span>
        </div>
      )}
    </div>
  );
}

function Icon({ d, label, className }: { d: string; label: string; className?: string }) {
  return (
    <svg
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={`h-6 w-6 ${className ?? ""}`}
    >
      <path d={d} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
