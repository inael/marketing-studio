"use client";

import { useState, type ReactNode } from "react";
import { readableOn } from "@/lib/ui";

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
  const cur = media.length ? Math.min(idx, media.length - 1) : 0;
  const go = (delta: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => Math.max(0, Math.min(media.length - 1, i + delta)));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      {/* header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picture}
            alt=""
            referrerPolicy="no-referrer"
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-offset-1 ring-offset-panel"
            style={{ ["--tw-ring-color" as string]: cor }}
          />
        ) : (
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
            style={{ background: cor, color: readableOn(cor) }}
          >
            {(username[0] ?? "?").toUpperCase()}
          </span>
        )}
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
          <img src={media[cur]} alt="" className="h-full w-full object-cover" />
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
          <p className={`whitespace-pre-wrap break-words text-ink ${compact ? "line-clamp-2" : ""}`}>
            <span className="font-semibold">{username} </span>
            {legenda}
            {tags.length > 0 && (
              <span className="text-info"> {tags.map((t) => `#${t}`).join(" ")}</span>
            )}
          </p>
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
