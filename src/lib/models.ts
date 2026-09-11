// Catálogo curado de modelos Higgsfield (o gallery completo tem 100+; aqui só os
// usados no estúdio). Dá pra digitar qualquer model_id na Config também.
//
// Custos conferidos em 2026-09-11 no endpoint /estimate da Higgsfield, que é
// gratuito e autoritativo por conta:
//   POST https://api.higgsfield.ai/estimate/<model_id>  -> {"credits","usd"}
//
// ATENÇÃO ao escolher modelo novo: os "365 Unlimited" que aparecem no app web
// da Higgsfield (Nano Banana, GPT Image, Seedream, Kling O1 Image, FLUX.2 Pro)
// NÃO existem na API REST — pedir por eles devolve `model_not_found`. A
// assinatura ilimitada vale pro site e pro MCP, não pra chave de API, que tem
// saldo próprio (dashboard em cloud.higgsfield.ai).

export type ModelOption = { id: string; label: string };

export const IMAGE_MODELS: ModelOption[] = [
  // 30x mais barato que o soul/standard pelo mesmo prompt e mesmo payload.
  { id: "higgsfield-ai/soul/v2/standard", label: "Soul v2 — padrão (0,05 créd. · ~US$0,004)" },
  { id: "higgsfield-ai/soul/standard", label: "Soul v1 — caro (1,5 créd. · ~US$0,094)" },
  { id: "higgsfield-ai/soul/v2/character", label: "Soul v2 — com personagem" },
];

// Seedance saiu da lista: tanto `bytedance/seedance/v1/pro/image-to-video`
// (que estava aqui) quanto o `/pro/fast/` do spec devolvem `model_not_found`
// nesta conta — era opção morta no seletor. Volta quando a conta liberar.
export const VIDEO_MODELS: ModelOption[] = [
  { id: "higgsfield-ai/dop/standard", label: "DoP — Higgsfield" },
  { id: "kling-video/v2.1/pro/image-to-video", label: "Kling 2.1 Pro — cinematográfico" },
];

export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0].id;
export const DEFAULT_VIDEO_MODEL = VIDEO_MODELS[0].id;
