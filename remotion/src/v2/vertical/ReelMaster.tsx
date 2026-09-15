import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import React from "react";
import { V2Frames, V2Offsets } from "../../theme-v2";
import { ProductCopy } from "../../data/copy";
import { HookScene } from "./scenes/HookScene";
import { SplitAScene } from "./scenes/SplitAScene";
import { FullscreenSolutionScene } from "./scenes/FullscreenSolutionScene";
import { SplitBScene } from "./scenes/SplitBScene";
import { CloseScene } from "./scenes/CloseScene";

/**
 * ReelMaster — orquestra 5 cenas (Hook + SplitA + Fullscreen + SplitB + Close)
 * pra qualquer produto (IB01/IB02/IB03) usando um talking head + audio VO.
 */
export type ReelMasterProps = {
  copy: ProductCopy;
  videoSrc: string; // talking/legacy-ibXX.mp4
  audioSrc: string; // audio/ibXX-vo.mp3
  painItems: string[];
  splitAHeader: string;
  fullscreenLabel: string; // ex "USETOKIA · +100 IAS · 1 CONTA"
  fullscreenBenefit: string; // ex "R$ 89 / mes. Chega."
  splitBBenefit: string;
  splitBSeals: string[];
  productTag: string; // ex "#IB01"
  waMsg: string;
};

export const ReelMaster: React.FC<ReelMasterProps> = (props) => {
  const {
    copy,
    videoSrc,
    audioSrc,
    painItems,
    splitAHeader,
    fullscreenLabel,
    fullscreenBenefit,
    splitBBenefit,
    splitBSeals,
    productTag,
    waMsg,
  } = props;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile(audioSrc)} />

      <Sequence from={V2Offsets.hook} durationInFrames={V2Frames.hook}>
        <HookScene
          videoSrc={videoSrc}
          hookWords={copy.hookWords}
          durationFrames={V2Frames.hook}
          productTag={productTag}
        />
      </Sequence>

      <Sequence from={V2Offsets.splitA} durationInFrames={V2Frames.splitA}>
        <SplitAScene
          videoSrc={videoSrc}
          painItems={painItems}
          header={splitAHeader}
          durationFrames={V2Frames.splitA}
        />
      </Sequence>

      <Sequence
        from={V2Offsets.fullscreen}
        durationInFrames={V2Frames.fullscreen}
      >
        <FullscreenSolutionScene
          label={fullscreenLabel}
          benefit={fullscreenBenefit}
          durationFrames={V2Frames.fullscreen}
        />
      </Sequence>

      <Sequence from={V2Offsets.splitB} durationInFrames={V2Frames.splitB}>
        <SplitBScene
          videoSrc={videoSrc}
          benefit={splitBBenefit}
          seals={splitBSeals}
          durationFrames={V2Frames.splitB}
        />
      </Sequence>

      <Sequence from={V2Offsets.close} durationInFrames={V2Frames.close}>
        <CloseScene
          productTag={productTag}
          ctaLine={copy.closeCTA.replace(/·.*/, "").trim()}
          waMsg={waMsg}
          durationFrames={V2Frames.close}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
