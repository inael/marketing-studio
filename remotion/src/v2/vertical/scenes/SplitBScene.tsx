import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import React from "react";
import { Colors, Fonts } from "../../../theme-v2";
import { SplitScreen } from "../../../primitives/SplitScreen";
import { TalkingHead } from "../../../primitives/TalkingHead";
import { easings } from "../../../anim/easings";

/**
 * Cena 4 — SplitB "beneficio" (~6s).
 * Top: talking head reacting;
 * Bottom: cartao verde com beneficio + selo NF-e/pt-BR/sem cambio.
 * Ordem invertida do SplitA pra dar variacao ritmica.
 */
export const SplitBScene: React.FC<{
  videoSrc: string;
  benefit: string;
  seals: string[]; // 3 selos curtos
  durationFrames: number;
}> = ({ videoSrc, benefit, seals, durationFrames }) => {
  const frame = useCurrentFrame();
  const ib = Colors.ib;

  return (
    <SplitScreen
      wipeFrames={10}
      top={
        <TalkingHead
          videoSrc={videoSrc}
          durationFrames={durationFrames}
          startOffset={5}
          zoom={[1.06, 1.14]}
        />
      }
      bottom={
        <AbsoluteFill
          style={{
            backgroundColor: Colors.bg,
            justifyContent: "center",
            alignItems: "center",
            padding: 60,
          }}
        >
          <div
            style={{
              width: "100%",
              padding: 48,
              backgroundColor: ib,
              color: "#000",
              fontFamily: Fonts.caption,
              fontSize: 96,
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              textAlign: "center",
              whiteSpace: "pre-line",
              opacity: interpolate(frame, [0, 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easings.snap,
              }),
              transform: `translateY(${
                interpolate(frame, [0, 12], [40, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: easings.snap,
                })
              }px)`,
            }}
          >
            {benefit}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 32,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {seals.map((s, i) => {
              const in_ = interpolate(
                frame,
                [16 + i * 6, 26 + i * 6],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: easings.snap,
                },
              );
              return (
                <div
                  key={s}
                  style={{
                    fontFamily: Fonts.body,
                    fontWeight: 700,
                    fontSize: 32,
                    color: Colors.fg,
                    padding: "10px 18px",
                    border: `1px solid ${Colors.fg}66`,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: in_,
                    lineHeight: 1,
                  }}
                >
                  {s}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      }
    />
  );
};
