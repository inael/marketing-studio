import React from "react";
import { IB03 } from "../../data/copy";
import { ReelMaster } from "./ReelMaster";

export const Reel03: React.FC = () => (
  <ReelMaster
    copy={IB03}
    videoSrc="talking/legacy-ib03.mp4"
    audioSrc="audio/ib03-vo.mp3"
    painItems={[
      "WhatsApp sem resposta",
      "Boleto vencido",
      "Agenda vazia",
      "Cliente reclamando",
    ]}
    splitAHeader="Seu negócio hoje:"
    fullscreenLabel={"IT Booster\nAutomação\nsob medida"}
    fullscreenBenefit="Você foca em vender."
    splitBBenefit={"Automação\npro seu negócio."}
    splitBSeals={["Sob medida", "A partir R$ 5K", "Diagnóstico grátis"]}
    productTag="#IB03"
    waMsg="manda #IB03 no meu zap"
  />
);
