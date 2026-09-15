import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { easings } from "../anim/easings";

/**
 * Split-screen vertical 50/50:
 * Top half = dor/produto/schematic UI
 * Bottom half = talking head
 *
 * A divisória entra com wipe suave (mask-reveal do centro).
 */
export const SplitScreen: React.FC<{
  top: React.ReactNode;
  bottom: React.ReactNode;
  fromFrame?: number;
  wipeFrames?: number;
}> = ({ top, bottom, fromFrame = 0, wipeFrames = 12 }) => {
  const frame = useCurrentFrame();
  const local = frame - fromFrame;
  const wipe = interpolate(local, [0, wipeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easings.outCubic,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "50%",
          overflow: "hidden",
          transform: `translateY(${(1 - wipe) * -40}px)`,
          opacity: wipe,
        }}
      >
        {top}
      </div>

      {/* Bottom */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: "50%",
          overflow: "hidden",
          transform: `translateY(${(1 - wipe) * 40}px)`,
          opacity: wipe,
        }}
      >
        {bottom}
      </div>

      {/* Divisória sutil */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: 4,
          background: "linear-gradient(90deg, transparent, #ffffff33, transparent)",
          opacity: wipe,
        }}
      />
    </AbsoluteFill>
  );
};
