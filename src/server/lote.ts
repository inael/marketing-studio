import { listPosts } from "./posts";
import { listTimeslots } from "./timeslots";
import { listAllBrands } from "./brands";

// D19: planeja o lote. Cada rascunho pronto (com arte e sem data) recebe o proximo
// horario livre da janela da sua marca, sem repetir horario ja ocupado.
export type PlanoItem = {
  id: string;
  brand_id: string;
  nome: string;
  cor: string;
  legenda: string;
  quando: string; // ISO
};

const chave = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}T${d.getHours()}:${d.getMinutes()}`;

export async function planejarLote(): Promise<{ plano: PlanoItem[]; semJanela: string[] }> {
  const [posts, brands] = await Promise.all([listPosts(), listAllBrands()]);
  const nomeDe = new Map(brands.map((b) => [b.id, b]));

  const prontos = posts
    // D19: so pautas aprovadas nas sugestoes (rascunhos que vieram de uma sugestao aceita)
    .filter((p) => p.status === "draft" && p.media.length > 0 && !p.scheduled_at && Boolean(p.fonte_tipo))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const ocupados = new Set(
    posts
      .filter((p) => p.scheduled_at && (p.status === "scheduled" || p.status === "approved"))
      .map((p) => chave(new Date(p.scheduled_at as string))),
  );

  // horarios candidatos por marca: proximos 60 dias, nas janelas, no futuro, livres
  const agora = Date.now();
  const filaPorMarca = new Map<string, Date[]>();
  const marcas = [...new Set(prontos.map((p) => p.brand_id))];
  const semJanela: string[] = [];
  for (const brandId of marcas) {
    const janelas = await listTimeslots(brandId);
    if (janelas.length === 0) {
      semJanela.push(nomeDe.get(brandId)?.nome ?? "?");
      filaPorMarca.set(brandId, []);
      continue;
    }
    const fila: Date[] = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    for (let dia = 0; dia < 60; dia++) {
      const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dia);
      for (const j of janelas.filter((x) => x.weekday === base.getDay()).sort((a, b) => a.hour - b.hour || a.minute - b.minute)) {
        const cand = new Date(base.getFullYear(), base.getMonth(), base.getDate(), j.hour, j.minute);
        if (cand.getTime() <= agora || ocupados.has(chave(cand))) continue;
        fila.push(cand);
      }
    }
    filaPorMarca.set(brandId, fila);
  }

  const plano: PlanoItem[] = [];
  for (const p of prontos) {
    const fila = filaPorMarca.get(p.brand_id);
    const quando = fila?.shift();
    if (!quando) continue;
    const b = nomeDe.get(p.brand_id);
    plano.push({
      id: p.id,
      brand_id: p.brand_id,
      nome: b?.nome ?? "?",
      cor: b?.cor_principal ?? "#888888",
      legenda: p.legenda ?? "",
      quando: quando.toISOString(),
    });
  }
  plano.sort((a, b) => new Date(a.quando).getTime() - new Date(b.quando).getTime());
  return { plano, semJanela };
}
