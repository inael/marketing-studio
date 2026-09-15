import { Composition } from "remotion";
import React from "react";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { V2, V2Frames } from "./theme-v2";
import { Feed01Master } from "./v2/feed/Feed01Master";
import { Feed02Master } from "./v2/feed/Feed02Master";
import { Feed03Master } from "./v2/feed/Feed03Master";
import { Reel01 } from "./v2/vertical/Reel01";
import { Reel02 } from "./v2/vertical/Reel02";
import { Reel03 } from "./v2/vertical/Reel03";

// Carrega fontes uma vez, top-level, pra Remotion garantir presença antes de renderizar.
loadBebas("normal", { subsets: ["latin"], weights: ["400"] });
loadInter("normal", { subsets: ["latin"], weights: ["400", "600", "700"] });

export const RemotionRoot: React.FC = () => (
  <>
    {/* === Feed estáticos (1080x1080) === */}
    <Composition
      id="feed-ib01"
      component={Feed01Master}
      durationInFrames={30}
      fps={V2.fps}
      width={V2.width}
      height={V2.heightSquare}
    />
    <Composition
      id="feed-ib02"
      component={Feed02Master}
      durationInFrames={30}
      fps={V2.fps}
      width={V2.width}
      height={V2.heightSquare}
    />
    <Composition
      id="feed-ib03"
      component={Feed03Master}
      durationInFrames={30}
      fps={V2.fps}
      width={V2.width}
      height={V2.heightSquare}
    />

    {/* === Reels (1080x1920) === */}
    <Composition
      id="reel-ib01"
      component={Reel01}
      durationInFrames={V2Frames.total}
      fps={V2.fps}
      width={V2.width}
      height={V2.heightVertical}
    />
    <Composition
      id="reel-ib02"
      component={Reel02}
      durationInFrames={V2Frames.total}
      fps={V2.fps}
      width={V2.width}
      height={V2.heightVertical}
    />
    <Composition
      id="reel-ib03"
      component={Reel03}
      durationInFrames={V2Frames.total}
      fps={V2.fps}
      width={V2.width}
      height={V2.heightVertical}
    />
  </>
);
