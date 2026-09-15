import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts } from "../../../theme-v2";
import { SplitScreen } from "../../../primitives/SplitScreen";
import { TalkingHead } from "../../../primitives/TalkingHead";
import { easings } from "../../../anim/easings";

/**
 * Cena 2 — SplitA "a dor" (~5s).
 * Top: schematic UI escuro com bullets de dor (marcas concorrentes riscadas)
 * Bottom: talking head enquadrado no split (metade inferior).
 */
export const SplitAScene: React.FC<{
  videoSrc: string;
  painItems: string[];
  header: string;
  durationFrames: number;
}> = ({ videoSrc, painItems, header, durationFrames }) => {
  const frame = useCurrentFrame();

  return (
    <SplitScreen
      wipeFrames={10}
      top={
        <AbsoluteFill
          style={{
            backgroundColor: Colors.bg,
            padding: 72,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: Fonts.caption,
              fontSize: 60,
              color: Colors.fg,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: 32,
              opacity: interpolate(frame, [0, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easings.snap,
              }),
            }}
          >
            {header}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {painItems.map((item, i) => {
              const in_ = interpolate(
                frame,
                [12 + i * 6, 22 + i * 6],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: easings.snap,
                },
              );
              return (
                <div
                  key={item}
                  style={{
                    fontFamily: Fonts.body,
                    fontSize: 44,
                    color: Colors.fgMuted,
                    padding: "14px 22px",
                    border: "1px solid #2a2a2a",
                    backgroundColor: "#141414",
                    textDecoration: "line-through",
                    textDecorationColor: Colors.ib,
                    textDecorationThickness: 3,
                    opacity: in_,
                    transform: `translateX(${(1 - in_) * -40}px)`,
                    lineHeight: 1.1,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      }
      bottom={
        <TalkingHead
          videoSrc={videoSrc}
          durationFrames={durationFrames}
          startOffset={2}
          zoom={[1.08, 1.16]}
        />
      }
    />
  );
};
