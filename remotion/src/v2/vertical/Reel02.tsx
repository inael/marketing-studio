import React from "react";
import { IB02 } from "../../data/copy";
import { ReelMaster } from "./ReelMaster";

export const Reel02: React.FC = () => (
  <ReelMaster
    copy={IB02}
    videoSrc="talking/legacy-ib02.mp4"
    audioSrc="audio/ib02-vo.mp3"
    painItems={[
      "US$ 300 no cartão",
      "IOF 3,5%",
      "Câmbio surpresa",
      "Bloqueio na fatura",
      "Sem NF-e",
    ]}
    splitAHeader="OpenAI direto:"
    fullscreenLabel={"UseTokia API\n1 chave\n+100 modelos"}
    fullscreenBenefit="Pago em real. NF-e."
    splitBBenefit={"1 chave.\n+100 modelos.\nEm real."}
    splitBSeals={["pay-as-you-go", "NF-e", "sem câmbio"]}
    productTag="#IB02"
    waMsg="manda #IB02 no meu zap"
  />
);
