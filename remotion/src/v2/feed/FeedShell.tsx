import { AbsoluteFill } from "remotion";
import React from "react";
import { Colors, Fonts } from "../../theme-v2";
import { LogoStamp } from "../../primitives/LogoStamp";
import { ProductCopy } from "../../data/copy";

/**
 * Layout compartilhado pros 3 feeds 1080x1080.
 * - Fundo preto (sem roxo, sem gradiente de IA)
 * - Accent unico = verde neon IT Booster
 * - Dor riscada + kicker de fechamento
 * - Preco/oferta hero + CTA no zap
 *
 * Cada produto passa headline, dorList (labels riscados), kicker, subline,
 * heroLabel (ex "AGORA PAGO") e priceLabel (ex "R$ 89 / mes" ou "grátis").
 */
export type FeedShellProps = {
  copy: ProductCopy;
  dorList: string[];
  kicker: string;
  heroLabel: string;
  priceMain: string; // ex "R$ 89"
  priceSuffix?: string; // ex "/ mes"
  ctaLine1: string; // ex "Chama no zap"
  ctaTag: string; // ex "#IB01"
  productTagLine: string; // ex "#IB01 · USETOKIA CHAT"
};

export const FeedShell: React.FC<FeedShellProps> = ({
  copy,
  dorList,
  kicker,
  heroLabel,
  priceMain,
  priceSuffix,
  ctaLine1,
  ctaTag,
  productTagLine,
}) => {
  const ib = Colors.ib;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: Colors.bg,
        color: Colors.fg,
        fontFamily: Fonts.body,
        display: "flex",
        flexDirection: "column",
        padding: 72,
      }}
    >
      {/* grid noise sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 60%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 3,
        }}
      >
        <LogoStamp size={34} accent={ib} />
        <div
          style={{
            fontFamily: Fonts.caption,
            fontSize: 26,
            letterSpacing: "0.14em",
            color: ib,
            padding: "6px 14px",
            border: `2px solid ${ib}`,
            lineHeight: 1,
          }}
        >
          {productTagLine}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: 68,
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            fontFamily: Fonts.caption,
            fontSize: 168,
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          {copy.headline}
        </div>

        <div
          style={{
            marginTop: 44,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            maxWidth: "92%",
          }}
        >
          {dorList.map((s) => (
            <div
              key={s}
              style={{
                fontFamily: Fonts.body,
                fontSize: 30,
                padding: "8px 18px",
                color: Colors.fgMuted,
                border: "1px solid #2a2a2a",
                backgroundColor: "#141414",
                textDecoration: "line-through",
                textDecorationColor: ib,
                textDecorationThickness: 3,
                lineHeight: 1,
              }}
            >
              {s}
            </div>
          ))}
          <div
            style={{
              fontFamily: Fonts.body,
              fontSize: 30,
              padding: "8px 18px",
              color: "#000",
              backgroundColor: ib,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {kicker}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          position: "relative",
          zIndex: 3,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
          gap: 40,
          borderTop: "2px solid #1a1a1a",
          paddingTop: 40,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: Fonts.body,
              fontSize: 24,
              color: Colors.fgMuted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {heroLabel}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 18,
              flexWrap: "nowrap",
            }}
          >
            <div
              style={{
                fontFamily: Fonts.caption,
                fontSize: 200,
                lineHeight: 0.85,
                color: ib,
                whiteSpace: "nowrap",
              }}
            >
              {priceMain}
            </div>
            {priceSuffix && (
              <div
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 34,
                  paddingBottom: 22,
                  color: Colors.fgMuted,
                }}
              >
                {priceSuffix}
              </div>
            )}
          </div>
          <div
            style={{
              fontFamily: Fonts.body,
              fontSize: 24,
              marginTop: 14,
              color: Colors.fgMuted,
            }}
          >
            {copy.subline}
          </div>
        </div>
        <div
          style={{
            padding: "24px 30px",
            backgroundColor: ib,
            color: "#000",
            fontFamily: Fonts.caption,
            fontSize: 44,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {ctaLine1}
          <div
            style={{
              fontFamily: Fonts.body,
              fontSize: 20,
              marginTop: 6,
              opacity: 0.75,
            }}
          >
            {ctaTag}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
