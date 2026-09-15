import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts } from "../../../theme-v2";
import { easings } from "../../../anim/easings";

/**
 * Cena 3 — Fullscreen "a solucao" (~7s).
 * Fundo preto com halo verde sutil. Label do produto imenso, sob-titulo mostrando
 * o beneficio central. Sem roxo, sem gradientes de cara de IA.
 */
export const FullscreenSolutionScene: React.FC<{
  label: string; // ex "USETOKIA · +100 IAS · 1 CONTA"
  benefit: string; // ex "R$ 89/mês. Chega."
  durationFrames: number;
}> = ({ label, benefit, durationFrames }) => {
  const frame = useCurrentFrame();
  const ib = Colors.ib;

  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.snap,
  });

  // Pulso sutil no halo
  const pulse = 1 + Math.sin(frame / 12) * 0.03;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Halo verde */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ib}55, transparent 62%)`,
          filter: "blur(80px)",
          transform: `scale(${pulse})`,
          opacity: enter * 0.6,
        }}
      />
      {/* Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(circle at 50% 50%, black, transparent 65%)",
        }}
      />

      {/* Anel verde */}
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          border: `3px solid ${ib}`,
          opacity: enter * 0.28,
          boxShadow: `0 0 60px ${ib}88, inset 0 0 40px ${ib}55`,
          transform: `scale(${pulse})`,
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          padding: "0 72px",
          textAlign: "center",
          zIndex: 3,
          transform: `translateY(${(1 - enter) * 60}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            fontFamily: Fonts.caption,
            fontSize: 140,
            fontWeight: 700,
            color: Colors.fg,
            lineHeight: 0.92,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            textShadow: `0 0 40px ${ib}88`,
            whiteSpace: "pre-line",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: Fonts.body,
            fontSize: 52,
            fontWeight: 600,
            color: ib,
            marginTop: 44,
            letterSpacing: "-0.01em",
          }}
        >
          {benefit}
        </div>
      </div>
    </AbsoluteFill>
  );
};
