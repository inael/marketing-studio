import { listPosts } from "./posts";
import { listarNotificacoes } from "./notificacoes";

// Contagens que aparecem ao lado dos itens do menu lateral.
// Mesmos critérios das telas de destino: aprovação = rascunho com mídia; falhas = post com falha.
export type ContagensMenu = { aprovacao: number; falhas: number; notificacoes: number };

export async function contagensMenu(): Promise<ContagensMenu> {
  const [posts, notas] = await Promise.all([listPosts(), listarNotificacoes()]);
  const ativos = posts.filter((p) => !p.deleted_at);
  return {
    aprovacao: ativos.filter((p) => p.status === "draft" && p.media.length > 0).length,
    falhas: ativos.filter((p) => p.status === "failed").length,
    notificacoes: notas.length,
  };
}
