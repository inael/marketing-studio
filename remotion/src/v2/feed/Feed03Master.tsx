import React from "react";
import { IB03 } from "../../data/copy";
import { FeedShell } from "./FeedShell";

export const Feed03Master: React.FC = () => (
  <FeedShell
    copy={IB03}
    dorList={[
      "WhatsApp sem resposta",
      "Boleto vencido",
      "Agenda vazia",
      "Cliente reclamando",
    ]}
    kicker="Automatizei"
    heroLabel="A partir de"
    priceMain="R$ 5K"
    priceSuffix="app sob medida"
    ctaLine1="Diagnóstico grátis"
    ctaTag="#IB03"
    productTagLine="#IB03 · IT BOOSTER AUTOMAÇÃO"
  />
);
