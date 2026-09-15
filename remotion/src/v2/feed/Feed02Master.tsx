import React from "react";
import { IB02 } from "../../data/copy";
import { FeedShell } from "./FeedShell";

export const Feed02Master: React.FC = () => (
  <FeedShell
    copy={IB02}
    dorList={[
      "OpenAI direto",
      "Anthropic direto",
      "US$ + IOF",
      "Cartão gringo",
      "NF-e não rola",
    ]}
    kicker="Migrei num sábado"
    heroLabel="Pagamento"
    priceMain="EM REAL"
    priceSuffix="pay-as-you-go"
    ctaLine1="Fala no zap"
    ctaTag="#IB02"
    productTagLine="#IB02 · USETOKIA API"
  />
);
