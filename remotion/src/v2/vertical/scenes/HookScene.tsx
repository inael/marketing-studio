import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts } from "../../../theme-v2";
import { BigCaption } from "../../../primitives/BigCaption";
import { TalkingHead } from "../../../primitives/TalkingHead";
import { easings } from "../../../anim/easings";

/**
 * Cena 1 — Hook (~3s).
 * Talking head fullscreen + caption word-by-word por cima, contorno preto.
 * Vinheta escura embaixo pra caption ficar legivel.
 */
export const HookScene: React.FC<{
  videoSrc: string;
  hookWords: string[];
  durationFrames: number;
  productTag: string;
}> = ({ videoSrc, hookWords, durationFrames, productTag }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.snap,
  });

  return (
    <AbsoluteFill>
      <TalkingHead
        videoSrc={videoSrc}
        durationFrames={durationFrames}
        zoom={[1.02, 1.1]}
      />

      {/* Vinheta bottom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "50%",
          background:
            "linear-gradient(180deg, transparent, rgba(0,0,0,0.85))",
          pointerEvents: "none",
        }}
      />

      {/* Product tag no topo */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          padding: "8px 16px",
          border: `2px solid ${Colors.ib}`,
          color: Colors.ib,
          fontFamily: Fonts.caption,
          fontSize: 32,
          letterSpacing: "0.14em",
          opacity: enter,
          lineHeight: 1,
        }}
      >
        {productTag}
      </div>

      <BigCaption
        words={hookWords}
        totalFrames={durationFrames}
        yOffset={300}
        fontSize={160}
      />
    </AbsoluteFill>
  );
};
