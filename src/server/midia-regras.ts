// B06: regras por rede lidas dos metadados reais. Devolve a lista completa de problemas,
// cada um com a correcao sugerida. Lista vazia = compativel e pode ficar pronta.
export type Rede = "instagram_feed" | "instagram_reel";
export type Metadados = { tipo: "image" | "video"; largura?: number; altura?: number; duracao?: number };
export type Problema = { campo: string; motivo: string; correcao: string };

const FEED_MIN = 4 / 5; // 4:5
const FEED_MAX = 1.91; // 1.91:1
const REEL = 9 / 16; // 9:16
const REEL_MAX_S = 90;

export function validarPorRede(m: Metadados, rede: Rede): Problema[] {
  const p: Problema[] = [];
  if (!m.largura || !m.altura) {
    return [{ campo: "arquivo", motivo: "não consegui ler as dimensões do arquivo", correcao: "envie o arquivo de novo; se persistir, exporte outra vez" }];
  }
  const ratio = m.largura / m.altura;
  const prop = `${m.largura}×${m.altura}`;

  if (rede === "instagram_feed") {
    if (ratio < FEED_MIN) p.push({ campo: "proporção", motivo: `${prop} é mais alta que 4:5 e o feed corta`, correcao: "recorte para 4:5 (ou 1:1)" });
    if (ratio > FEED_MAX) p.push({ campo: "proporção", motivo: `${prop} é mais larga que 1.91:1 e o feed corta`, correcao: "recorte para 1.91:1 ou menos" });
  }

  if (rede === "instagram_reel") {
    if (m.tipo !== "video") p.push({ campo: "tipo", motivo: "reel precisa ser vídeo", correcao: "envie um vídeo ou publique como imagem" });
    if (Math.abs(ratio - REEL) > 0.02) p.push({ campo: "proporção", motivo: `${prop} não é 9:16`, correcao: "recorte para 9:16" });
    if ((m.duracao ?? 0) > REEL_MAX_S) p.push({ campo: "duração", motivo: `${Math.round(m.duracao ?? 0)}s passa de ${REEL_MAX_S}s`, correcao: `corte para até ${REEL_MAX_S}s` });
  }

  return p;
}
