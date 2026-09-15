import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors } from "../theme-v2";

/**
 * Talking head fullscreen (ou dentro do split-screen bottom).
 * Aceita videoSrc estilo `talking/karla-ib01.mp4` ou fallback estático de imagem.
 * Aplica zoom-in muito sutil (Ken Burns) pra evitar sensação de foto estática.
 */
export const TalkingHead: React.FC<{
  videoSrc?: string; // caminho relativo em public/ (ex: talking/karla-ib01.mp4)
  imgSrc?: string; // fallback estático
  startOffset?: number; // segundos do vídeo pra começar
  zoom?: [number, number]; // [startScale, endScale]
  durationFrames: number;
  fromFrame?: number;
}> = ({ videoSrc, imgSrc, startOffset = 0, zoom = [1.05, 1.12], durationFrames, fromFrame = 0 }) => {
  const frame = useCurrentFrame();
  const local = frame - fromFrame;
  const t = interpolate(local, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(t, [0, 1], zoom);

  return (
    <AbsoluteFill style={{ backgroundColor: Colors.bg, overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale})`,
          transformOrigin: "center 40%",
        }}
      >
        {videoSrc ? (
          <OffthreadVideo
            src={staticFile(videoSrc)}
            startFrom={Math.floor(startOffset * 30)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            muted
          />
        ) : imgSrc ? (
          <img
            src={staticFile(imgSrc)}
            alt="persona"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: Colors.fgMuted,
              fontFamily: "Inter",
              fontSize: 32,
              background: "linear-gradient(135deg,#0a0a0a,#1a1a1a)",
            }}
          >
            [persona placeholder]
          </div>
        )}
      </div>

      {/* Vinheta leve pra dar profundidade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.55))",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
