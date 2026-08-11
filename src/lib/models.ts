// Catálogo curado de modelos Higgsfield (o gallery completo tem 100+; aqui só os
// usados no estúdio). Dá pra digitar qualquer model_id na Config também.

export type ModelOption = { id: string; label: string };

export const IMAGE_MODELS: ModelOption[] = [
  { id: "higgsfield-ai/soul/standard", label: "Soul — flagship (Higgsfield)" },
  { id: "reve/text-to-image", label: "Reve — text-to-image" },
];

export const VIDEO_MODELS: ModelOption[] = [
  { id: "higgsfield-ai/dop/standard", label: "DoP — Higgsfield" },
  { id: "kling-video/v2.1/pro/image-to-video", label: "Kling 2.1 Pro — cinematográfico" },
  { id: "bytedance/seedance/v1/pro/image-to-video", label: "Seedance 1.0 Pro — ByteDance" },
];

export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0].id;
export const DEFAULT_VIDEO_MODEL = VIDEO_MODELS[0].id;
