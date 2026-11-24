import { listPosts } from "./posts";
import { listarNotificacoes } from "./notificacoes";

// Contagens que aparecem ao lado dos itens do menu lateral.
// Mesmos critérios das telas de destino: aprovação = rascunho com mídia; falhas = post com falha.
// Cada contagem é isolada: se uma fonte falhar (ex.: tabela ainda não migrada), o menu mostra 0 e a tela segue.
export type ContagensMenu = { aprovacao: number; falhas: number; notificacoes: number };

export async function contagensMenu(): Promise<ContagensMenu> {
  const zero: ContagensMenu = { aprovacao: 0, falhas: 0, notificacoes: 0 };
  const [posts, notas] = await Promise.all([
    listPosts().catch(() => null),
    listarNotificacoes().catch(() => null),
  ]);
  const ativos = (posts ?? []).filter((p) => !p.deleted_at);
  return {
    aprovacao: posts ? ativos.filter((p) => p.status === "draft" && p.media.length > 0).length : zero.aprovacao,
    falhas: posts ? ativos.filter((p) => p.status === "failed").length : zero.falhas,
    notificacoes: notas ? notas.length : zero.notificacoes,
  };
}
