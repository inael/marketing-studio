import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts } from "../theme-v2";
import { easings } from "../anim/easings";

/**
 * Cena "tela cheia" (produto/beneficio). Fundo escuro com um badge de cor
 * do produto pulsando + label gigante centralizada.
 */
export const FullscreenScene: React.FC<{
  label: string;
  accent: string;
  fromFrame?: number;
  bg?: string;
}> = ({ label, accent, fromFrame = 0, bg = Colors.bg }) => {
  const frame = useCurrentFrame();
  const local = frame - fromFrame;

  const enter = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.snap,
  });
  const pulse =
    1 + Math.sin(local / 6) * 0.02 * Math.min(1, Math.max(0, local / 15));

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, ${accent}22, ${bg} 65%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Halo do accent */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}55, transparent 60%)`,
          filter: "blur(60px)",
          transform: `scale(${pulse})`,
          opacity: enter,
        }}
      />
      {/* Anel do accent */}
      <div
        style={{
          position: "absolute",
          width: 640,
          height: 640,
          borderRadius: "50%",
          border: `3px solid ${accent}`,
          opacity: enter * 0.35,
          boxShadow: `0 0 60px ${accent}88, inset 0 0 40px ${accent}55`,
          transform: `scale(${pulse})`,
        }}
      />

      {/* Label */}
      <div
        style={{
          transform: `translateY(${(1 - enter) * 40}px) scale(${enter})`,
          opacity: enter,
          fontFamily: Fonts.caption,
          fontSize: 110,
          fontWeight: 700,
          color: Colors.fg,
          textAlign: "center",
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "-0.01em",
          WebkitTextStroke: `8px ${Colors.captionStroke}`,
          paintOrder: "stroke fill",
          maxWidth: "82%",
          padding: "24px",
          textShadow: `0 0 40px ${accent}88`,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
