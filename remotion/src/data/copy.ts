// Copy strings dos 3 Reels + 3 Feeds. Alterar aqui reflow em todas as cenas.

export type ProductCopy = {
  productCode: "IB01" | "IB02" | "IB03";
  productName: string;
  productTag: string;
  hookWords: string[]; // caption word-by-word do hook
  splitADor: string;
  fullscreenLabel: string;
  splitBBenefit: string;
  closeCTA: string;
  headline: string; // pra feed estático (bold gigante)
  subline: string; // rodapé no feed
  waPhone: string;
  waMsg: string;
};

export const IB01: ProductCopy = {
  productCode: "IB01",
  productName: "UseTokia CHAT",
  productTag: "Uma assinatura, +100 IAs",
  hookWords: [
    "TAVA",
    "PAGANDO",
    "600",
    "REAIS",
    "EM",
    "5",
    "ASSINATURAS",
    "DE",
    "IA",
  ],
  splitADor: "ChatGPT R$100 · Claude R$120 · Gemini R$95 · Perplexity R$105 · Cursor R$180",
  fullscreenLabel: "UseTokia · +100 modelos · 1 conta",
  splitBBenefit: "R$ 89/mês. Cancelei o resto.",
  closeCTA: "Chama no zap · #IB01",
  headline: "UMA ASSINATURA. +100 IAs.",
  subline: "R$ 89/mês · NF-e · Suporte pt-BR",
  waPhone: "5561991196730",
  waMsg: "#IB01 quero testar o UseTokia",
};

export const IB02: ProductCopy = {
  productCode: "IB02",
  productName: "UseTokia API",
  productTag: "1 chave, +100 modelos, real",
  hookWords: [
    "CÂMBIO",
    "SPREAD",
    "IOF",
    "CARTÃO",
    "BLOQUEANDO",
    "FIM",
  ],
  splitADor: "OpenAI · Anthropic · Google · US$ · IOF · Cartão gringo",
  fullscreenLabel: "UseTokia API · 1 chave · NF-e",
  splitBBenefit: "Pago em real. Migra num sábado.",
  closeCTA: "Fala no zap · #IB02",
  headline: "1 CHAVE. +100 MODELOS. REAL.",
  subline: "pay-as-you-go · NF-e · sem câmbio",
  waPhone: "5561991196730",
  waMsg: "#IB02 sou dev, quero migrar API",
};

export const IB03: ProductCopy = {
  productCode: "IB03",
  productName: "IT Booster Automação",
  productTag: "App sob medida pra negócio",
  hookWords: [
    "CLIENTE",
    "MANDOU",
    "SÁBADO",
    "NINGUÉM",
    "VIU",
  ],
  splitADor: "WhatsApp sem resposta · boleto vencido · agenda vazia",
  fullscreenLabel: "IT Booster · agendamento · cobrança · atendimento",
  splitBBenefit: "Automação sob medida. Você foca em vender.",
  closeCTA: "Diagnóstico grátis · #IB03",
  headline: "MAIS VENDAS. MENOS SUSTO.",
  subline: "Automação sob medida · Diagnóstico grátis",
  waPhone: "5561991196730",
  waMsg: "#IB03 quero automatizar meu negócio",
};

export const ALL_PRODUCTS = [IB01, IB02, IB03] as const;
