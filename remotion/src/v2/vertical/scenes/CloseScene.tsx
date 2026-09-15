import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts } from "../../../theme-v2";
import { LogoStamp } from "../../../primitives/LogoStamp";
import { easings } from "../../../anim/easings";

/**
 * Cena 5 — Close (~5s).
 * Fundo preto, wordmark IT Booster gigante, CTA "Chama no zap · #IBxx".
 * Contato: 5561925291112 (SimplesZap oficial IT Booster).
 */
export const CloseScene: React.FC<{
  productTag: string; // ex "#IB01"
  ctaLine: string; // ex "Chama no zap"
  waMsg: string; // ex "manda #IB01 no meu zap"
  durationFrames: number;
}> = ({ productTag, ctaLine, waMsg, durationFrames }) => {
  const frame = useCurrentFrame();
  const ib = Colors.ib;

  const enter = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.snap,
  });

  const tagPulse = 1 + Math.sin(frame / 10) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.bg,
        justifyContent: "center",
        alignItems: "center",
        padding: 72,
      }}
    >
      {/* Halo */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ib}44, transparent 60%)`,
          filter: "blur(80px)",
          opacity: enter * 0.7,
          top: "20%",
        }}
      />

      {/* Wordmark IT Booster gigante */}
      <div
        style={{
          transform: `scale(${enter})`,
          opacity: enter,
          marginBottom: 60,
        }}
      >
        <LogoStamp size={140} accent={ib} />
      </div>

      {/* CTA */}
      <div
        style={{
          padding: "36px 60px",
          backgroundColor: ib,
          color: "#000",
          fontFamily: Fonts.caption,
          fontSize: 96,
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          transform: `translateY(${(1 - enter) * 60}px) scale(${tagPulse})`,
          opacity: enter,
          boxShadow: `0 0 60px ${ib}88`,
          textAlign: "center",
        }}
      >
        {ctaLine}
      </div>

      {/* Product tag */}
      <div
        style={{
          fontFamily: Fonts.caption,
          fontSize: 96,
          color: Colors.fg,
          marginTop: 32,
          opacity: enter,
          letterSpacing: "0.12em",
          textShadow: `0 0 30px ${ib}88`,
        }}
      >
        {productTag}
      </div>

      {/* Mensagem */}
      <div
        style={{
          fontFamily: Fonts.body,
          fontSize: 34,
          color: Colors.fgMuted,
          marginTop: 40,
          opacity: enter,
          maxWidth: 720,
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        "{waMsg}"
      </div>

      {/* Rodape com WhatsApp */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          fontFamily: Fonts.body,
          fontSize: 28,
          color: ib,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: enter,
        }}
      >
        WhatsApp · Brasília DF
      </div>
    </AbsoluteFill>
  );
};
