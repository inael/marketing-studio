"use client";

import { useState } from "react";
import { readableOn } from "@/lib/ui";

/**
 * Avatar de marca com fallback real.
 *
 * A foto do Instagram (`profile_picture_url` do Graph) é uma URL ASSINADA do
 * CDN da Meta — ela expira em alguns dias. Como os `<img>` do console não
 * tratavam o erro de carregamento, a expiração aparecia como ícone de imagem
 * quebrada em todo lugar (dashboard, lista de posts, preview do IG).
 *
 * Aqui a falha cai no círculo com a inicial e a cor da marca, que é o mesmo
 * fallback já usado quando a marca não tem foto nenhuma.
 */
export function Avatar({
  src,
  nome,
  cor,
  size = 32,
  ring = false,
  title,
  className = "",
}: {
  src?: string | null;
  nome: string;
  cor: string;
  size?: number;
  ring?: boolean;
  title?: string;
  className?: string;
}) {
  // guarda QUAL url falhou, não um booleano: trocar de marca (ou a foto ser
  // renovada no R2) já dá uma chance nova à imagem, sem effect de reset.
  const [falhou, setFalhou] = useState<string | null>(null);
  const broken = !!src && falhou === src;

  const box = { width: size, height: size };

  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        title={title}
        referrerPolicy="no-referrer"
        onError={() => setFalhou(src)}
        style={ring ? { ...box, ["--tw-ring-color" as string]: cor } : box}
        className={`shrink-0 rounded-full object-cover ${
          ring ? "ring-2 ring-offset-1 ring-offset-panel" : ""
        } ${className}`}
      />
    );
  }

  return (
    <span
      title={title}
      aria-hidden
      style={{ ...box, background: cor, color: readableOn(cor), fontSize: Math.round(size * 0.4) }}
      className={`grid shrink-0 place-items-center rounded-full font-semibold leading-none ${className}`}
    >
      {(nome.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
