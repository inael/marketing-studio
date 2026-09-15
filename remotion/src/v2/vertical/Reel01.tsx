import React from "react";
import { IB01 } from "../../data/copy";
import { ReelMaster } from "./ReelMaster";

export const Reel01: React.FC = () => (
  <ReelMaster
    copy={IB01}
    videoSrc="talking/legacy-ib01.mp4"
    audioSrc="audio/ib01-vo.mp3"
    painItems={[
      "ChatGPT R$100",
      "Claude R$120",
      "Gemini R$95",
      "Perplexity R$105",
      "Cursor R$180",
    ]}
    splitAHeader="Antes eu pagava..."
    fullscreenLabel={"UseTokia\n+100 IAs\n1 conta"}
    fullscreenBenefit="R$ 89/mês. Chega."
    splitBBenefit={"Uma\nassinatura.\nAcabou."}
    splitBSeals={["NF-e", "pt-BR", "Sem cartão gringo"]}
    productTag="#IB01"
    waMsg="manda #IB01 no meu zap"
  />
);
