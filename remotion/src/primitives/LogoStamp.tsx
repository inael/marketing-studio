import React from "react";
import { Colors, Fonts } from "../theme-v2";

/**
 * Wordmark "IT BOOSTER" simples e legível pra usar como stamp de rodapé.
 * (Substituir por SVG oficial quando tivermos.)
 */
export const LogoStamp: React.FC<{
  size?: number;
  color?: string;
  accent?: string;
}> = ({ size = 34, color = Colors.fg, accent = Colors.ib }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: Fonts.caption,
      fontSize: size,
      fontWeight: 700,
      color,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      lineHeight: 1,
    }}
  >
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: accent,
        boxShadow: `0 0 20px ${accent}66`,
        display: "grid",
        placeItems: "center",
        color: "#000",
        fontFamily: Fonts.caption,
        fontSize: size * 0.7,
      }}
    >
      IT
    </div>
    <span>BOOSTER</span>
  </div>
);
