import React from "react";
import { IB01 } from "../../data/copy";
import { FeedShell } from "./FeedShell";

export const Feed01Master: React.FC = () => (
  <FeedShell
    copy={IB01}
    dorList={[
      "ChatGPT R$100",
      "Claude R$120",
      "Gemini R$95",
      "Perplexity R$105",
      "Cursor R$180",
    ]}
    kicker="Cancelei tudo"
    heroLabel="Agora pago"
    priceMain="R$ 89"
    priceSuffix="/ mês"
    ctaLine1="Chama no zap"
    ctaTag="#IB01"
    productTagLine="#IB01 · USETOKIA CHAT"
  />
);
