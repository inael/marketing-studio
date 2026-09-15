import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts, V2 } from "../theme-v2";
import { easings } from "../anim/easings";

/**
 * Legenda estilo lucasarrial / finscalebr:
 * uma palavra por vez (upper-case Bebas Neue bold branca com contorno preto)
 * centralizada, pulsando levemente na entrada.
 *
 * Cada palavra fica visível por `wordFrames` frames. Progressão automática.
 */
export type BigCaptionProps = {
  words: string[];
  startFrame?: number; // frame do sequence em que a palavra 1 começa
  wordFrames?: number; // duração de cada palavra (default: dividir uniformemente)
  totalFrames?: number; // duração total do bloco de captions
  yOffset?: number; // deslocamento vertical (0 = centro)
  fontSize?: number;
};

export const BigCaption: React.FC<BigCaptionProps> = ({
  words,
  startFrame = 0,
  wordFrames,
  totalFrames,
  yOffset = 0,
  fontSize = 120,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;

  const perWord =
    wordFrames ?? (totalFrames ? Math.floor(totalFrames / words.length) : 18);
  const idx = Math.max(0, Math.min(words.length - 1, Math.floor(local / perWord)));

  if (local < 0) return null;
  if (totalFrames && local >= totalFrames) return null;

  const wordLocal = local - idx * perWord;
  const enter = interpolate(wordLocal, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: easings.snap,
  });
  const scale = interpolate(enter, [0, 1], [0.7, 1]);
  const opacity = enter;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateY(${yOffset}px) scale(${scale})`,
          opacity,
          fontFamily: Fonts.caption,
          fontSize,
          fontWeight: 700,
          color: Colors.fg,
          textAlign: "center",
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          WebkitTextStroke: `8px ${Colors.captionStroke}`,
          paintOrder: "stroke fill",
          maxWidth: "88%",
          padding: "16px 24px",
          textShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}
      >
        {words[idx]}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Uma frase inteira estilo lower-third (rodapé), útil pra CTAs curtos.
 */
export const CTACaption: React.FC<{
  text: string;
  fromFrame?: number;
  fontSize?: number;
  color?: string;
}> = ({ text, fromFrame = 0, fontSize = 88, color = Colors.fg }) => {
  const frame = useCurrentFrame();
  const local = frame - fromFrame;
  const enter = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.snap,
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 200,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - enter) * 40}px)`,
          opacity: enter,
          fontFamily: Fonts.caption,
          fontSize,
          fontWeight: 700,
          color,
          textAlign: "center",
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          WebkitTextStroke: `6px ${Colors.captionStroke}`,
          paintOrder: "stroke fill",
          maxWidth: "90%",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
