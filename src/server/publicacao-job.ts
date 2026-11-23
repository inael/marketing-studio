import { sql } from "./db";
import { listPosts, setPostStatus, type Post } from "./posts";
import { publishPost } from "./publish";
import { notificar } from "./notificacoes";
import { getBrandById } from "./brands";
import { publicarLinkedin } from "./linkedin";

// B11: lote pequeno, trava por post (so quem trava publica) e nova tentativa com recuo.
export const LOTE = 10;
export const TRAVA_MIN = 5;
export const RECUO_MIN = [1, 3, 9]; // minutos entre as tentativas
export const MAX_TENTATIVAS = 4;

// B16: transitorio (volta a tentar) x definitivo (nao repete e avisa o time)
export function classificarErro(msg: string): "transitorio" | "definitivo" {
  if (/token|credencial|sem credenciais|permiss|expirad|revogad|desconect|invalid_?token/i.test(msg)) return "definitivo";
  if (/recus|policy|conteúdo|conteudo|content|post_not_found|brand_not_found/i.test(msg)) return "definitivo";
  return "transitorio"; // timeout, 429, 5xx, rede e o que nao se reconhece
}

/** posts vencidos, livres (sem trava ativa) e sem tentativa adiada, no maximo LOTE */
export async function pegarLote(agora: Date): Promise<Post[]> {
  const todos = await listPosts();
  const t = agora.getTime();
  return todos
    .filter((p) => !p.deleted_at)
    .filter((p) => p.status === "scheduled" || p.status === "approved")
    .filter((p) => p.scheduled_at && new Date(p.scheduled_at).getTime() <= t)
    .filter((p) => !p.next_attempt_at || new Date(p.next_attempt_at).getTime() <= t)
    .filter((p) => !p.locked_until || new Date(p.locked_until).getTime() < t)
    .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime())
    .slice(0, LOTE);
}

export async function rodarJob(agora = new Date()) {
  const lote = await pegarLote(agora);
  const resultados: { id: string; resultado: string }[] = [];
  for (const p of lote) {
    // trava: grava a trava e so segue quem a gravou
    const trava = new Date(agora.getTime() + TRAVA_MIN * 60000).toISOString();
    const travado = await sql<{ id: string }[]>`update posts set locked_until = ${trava} where id = ${p.id} returning id`;
    if (travado.length === 0) continue;
    if (p.status !== "approved") await setPostStatus(p.id, "approved");
    const r = await publishPost(p.id);
    if (r.ok) {
      // B15: marca com LinkedIn conectado: publica tambem la (falha do LinkedIn vira aviso, nao derruba o post do Instagram)
      const marca = await getBrandById(p.brand_id);
      if (marca?.linkedin_org_id && marca.linkedin_token) {
        const li = await publicarLinkedin({ orgId: marca.linkedin_org_id, token: marca.linkedin_token }, p.legenda);
        if (!li.ok) await notificar({ tipo: "acao", titulo: `Saiu no Instagram, mas não no LinkedIn: ${li.motivo}`, href: `/marcas/${marca.slug}/conectar` });
        else await sql`insert into publish_logs (post_id, rede, status, external_id, erro) values (${p.id}, ${"li"}, ${"published"}, ${li.id}, ${null})`;
      }
      await sql`update posts set locked_until = null, last_error = null where id = ${p.id}`;
      resultados.push({ id: p.id, resultado: "publicado" });
      continue;
    }
    const msg = String(r.error ?? "erro");
    const tentativas = (p.attempts ?? 0) + 1;
    const tipo = classificarErro(msg);
    if (tipo === "definitivo") {
      await sql`update posts set status = ${"failed"}, attempts = ${tentativas}, last_error = ${msg}, error_kind = ${"definitivo"}, locked_until = null where id = ${p.id}`;
      await notificar({ tipo: "acao", titulo: `Post não saiu: ${msg}`, detalhe: "falha definitiva; precisa de ação do time", href: "/posts" });
      resultados.push({ id: p.id, resultado: "falha definitiva" });
    } else if (tentativas >= MAX_TENTATIVAS) {
      await sql`update posts set status = ${"failed"}, attempts = ${tentativas}, last_error = ${"tentativas esgotadas: " + msg}, error_kind = ${"transitorio"}, locked_until = null where id = ${p.id}`;
      await notificar({ tipo: "acao", titulo: `Post esgotou as tentativas: ${msg}`, detalhe: `${MAX_TENTATIVAS} tentativas sem sucesso`, href: "/posts" });
      resultados.push({ id: p.id, resultado: "tentativas esgotadas" });
    } else {
      const proxima = new Date(agora.getTime() + RECUO_MIN[tentativas - 1] * 60000).toISOString();
      await sql`update posts set status = ${"scheduled"}, attempts = ${tentativas}, next_attempt_at = ${proxima}, last_error = ${msg}, error_kind = ${"transitorio"}, locked_until = null where id = ${p.id}`;
      resultados.push({ id: p.id, resultado: `nova tentativa em ${RECUO_MIN[tentativas - 1]} min` });
    }
  }
  return { processados: lote.length, resultados };
}
