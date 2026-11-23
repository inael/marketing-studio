import { sql } from "./db";
import { getPost, type PostStatus } from "./posts";
import { invalidarDashboard } from "./dashboard";

// B10: um ponto de entrada para mudar o estado. Transicao invalida nao grava nada.
const TRANSICOES: Record<PostStatus, PostStatus[]> = {
  draft: ["approved", "scheduled"],
  approved: ["scheduled", "published", "draft"],
  scheduled: ["published", "failed", "approved", "draft"],
  failed: ["scheduled", "approved", "draft", "published"],
  published: [],
};

export type ResultadoEstado = { ok: true } | { ok: false; codigo: 409 | 422; motivo: string; atual?: PostStatus };

export async function transicionar(postId: string, para: PostStatus, quem: string | null, motivo: string): Promise<ResultadoEstado> {
  const p = await getPost(postId);
  if (!p) return { ok: false, codigo: 422, motivo: "post não encontrado" };
  const de = p.status as PostStatus;
  if (de === para) return { ok: true };
  if (!TRANSICOES[de]?.includes(para)) {
    return { ok: false, codigo: 422, motivo: `não dá para ir de ${de} para ${para}`, atual: de };
  }
  // a gravacao so acontece se o estado ainda for o lido (corrida entre dois cliques)
  const grav = await sql<{ id: string }[]>`update posts set status = ${para}, status_changed_at = now(), updated_at = now() where id = ${postId} and status = ${de} returning id`;
  if (grav.length === 0) {
    const agora = await getPost(postId);
    return { ok: false, codigo: 409, motivo: `o estado mudou antes: agora está ${agora?.status ?? "indefinido"}`, atual: (agora?.status as PostStatus) ?? undefined };
  }
  invalidarDashboard();
  try {
    await sql`insert into post_status_log (post_id, de, para, quem, motivo) values (${postId}, ${de}, ${para}, ${quem}, ${motivo})`;
  } catch {
    // o registro nao pode impedir a mudanca ja gravada
  }
  return { ok: true };
}
