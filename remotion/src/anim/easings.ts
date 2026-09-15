import { Easing } from "remotion";

export const easings = {
  // Curva out-cubic — bom pra reveals suaves (mask, opacity)
  outCubic: Easing.bezier(0.16, 1, 0.3, 1),
  // Snap punch — usado no ZoomPunch e PopIn
  snap: Easing.bezier(0.8, 0, 0.1, 1),
  // In-out padrão
  inOut: Easing.inOut(Easing.ease),
  // Elastic pop — para elementos que "chegam" com energia
  elastic: Easing.bezier(0.34, 1.56, 0.64, 1),
};
