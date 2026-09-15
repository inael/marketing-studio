// Timing + colors + fonts constants para os 3 Reels e 3 Feeds IT Booster
// Todas as cenas puxam daqui. Mudar aqui reflow tudo.

export const V2 = {
  fps: 30,
  width: 1080,
  heightVertical: 1920,
  heightSquare: 1080,

  // Duração de cada Reel em segundos (target)
  reelSecs: 26,

  // Duração de cada etapa dentro do Reel (segundos)
  stage: {
    hook: 3,
    splitA: 5,
    fullscreen: 7,
    splitB: 6,
    close: 5,
  },
} as const;

export const V2Frames = {
  hook: V2.stage.hook * V2.fps,
  splitA: V2.stage.splitA * V2.fps,
  fullscreen: V2.stage.fullscreen * V2.fps,
  splitB: V2.stage.splitB * V2.fps,
  close: V2.stage.close * V2.fps,
  total:
    (V2.stage.hook +
      V2.stage.splitA +
      V2.stage.fullscreen +
      V2.stage.splitB +
      V2.stage.close) *
    V2.fps,
} as const;

// Offsets acumulados (frame em que cada etapa começa)
export const V2Offsets = {
  hook: 0,
  splitA: V2Frames.hook,
  fullscreen: V2Frames.hook + V2Frames.splitA,
  splitB: V2Frames.hook + V2Frames.splitA + V2Frames.fullscreen,
  close: V2Frames.hook + V2Frames.splitA + V2Frames.fullscreen + V2Frames.splitB,
} as const;

export const Colors = {
  bg: "#0A0A0A",
  fg: "#FFFFFF",
  fgMuted: "#B4B4B4",
  captionBg: "rgba(0,0,0,0.72)",
  captionStroke: "#000000",

  // Accent IT Booster
  ib: "#39FF14",

  // Por produto
  tokiaChat: {
    primary: "#7C3AED",
    glow: "#A855F7",
    accent: "#FFFFFF",
  },
  tokiaApi: {
    primary: "#06B6D4",
    glow: "#22D3EE",
    accent: "#0EA5E9",
  },
  itbooster: {
    primary: "#39FF14",
    glow: "#FACC15",
    accent: "#FFFFFF",
  },
} as const;

export const Fonts = {
  caption: "Bebas Neue",
  body: "Inter",
} as const;
