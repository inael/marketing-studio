// B08: versao da legenda por rede. A original nunca muda: aqui so se calcula o que caberia em cada rede
// e o que mudaria, para a pessoa aprovar sem reler tudo. Funcao pura (roda no navegador).
export const REDES = {
  instagram: { nome: "Instagram", limite: 2200, hashtags: 30 },
  linkedin: { nome: "LinkedIn", limite: 3000, hashtags: 5 },
  x: { nome: "X", limite: 280, hashtags: 2 },
} as const;
export type RedeId = keyof typeof REDES;

export type Versao = {
  rede: RedeId;
  nome: string;
  body: string;
  contagem: number;
  limite: number;
  mudou: boolean;
  resumo: string;
  bloqueada: string | null; // link quebrado ou corte impossivel: pede ajuste manual
};

export function adaptar(legenda: string, hashtags: string[], rede: RedeId): Versao {
  const r = REDES[rede];
  const links = legenda.match(/https?:\/\/\S+/g) ?? [];
  const tagsOriginais = [...(legenda.match(/#\w+/g) ?? []), ...hashtags.map((t) => `#${t.replace(/^#/, "")}`)];
  const tituloTags = Array.from(new Set(tagsOriginais));
  const texto = legenda.replace(/#\w+/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const tags = tituloTags.slice(0, r.hashtags);
  const sufixo = tags.length ? `\n\n${tags.join(" ")}` : "";
  const maximo = r.limite - sufixo.length;

  let corpo = texto;
  let cortado = false;
  if (corpo.length > maximo) {
    cortado = true;
    const corte = corpo.slice(0, maximo);
    const ponto = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("! "), corte.lastIndexOf("? "));
    const espaco = corte.lastIndexOf(" ");
    corpo = (ponto > maximo * 0.5 ? corte.slice(0, ponto + 1) : espaco > 0 ? corte.slice(0, espaco) : corte).trimEnd();
  }
  const body = (corpo + sufixo).trim();

  const linkPerdido = links.find((u) => !body.includes(u));
  const estouraDepois = body.length > r.limite;
  const bloqueada = linkPerdido
    ? `o link ${linkPerdido} sairia do texto: bloqueado, refaça só esta versão`
    : estouraDepois
      ? "ainda passa do limite: a pessoa decide o corte manual"
      : null;

  const partes: string[] = [];
  if (cortado) partes.push(`texto cortado em ${texto.length - corpo.length} caracteres`);
  if (tags.length < tituloTags.length) partes.push(`${tituloTags.length - tags.length} hashtag(s) fora`);
  return {
    rede,
    nome: r.nome,
    body,
    contagem: body.length,
    limite: r.limite,
    mudou: body !== legenda.trim(),
    resumo: partes.join("; "),
    bloqueada,
  };
}
