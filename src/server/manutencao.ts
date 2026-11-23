import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "./db";
import { listPosts } from "./posts";
import { s3 } from "./r2";

// B49: conciliacao. Trava vencida (job que caiu no meio) e liberada; o post volta a ser pego pelo job.
export async function conciliarEstado(agora = new Date()) {
  const todos = await listPosts();
  let liberados = 0;
  for (const p of todos) {
    if (p.locked_until && new Date(p.locked_until).getTime() < agora.getTime()) {
      await sql`update posts set locked_until = null where id = ${p.id}`;
      liberados++;
    }
  }
  return { travasLiberadas: liberados };
}

// B36: midia orfa = envio que nunca foi confirmado (status enviando) ou que falhou na conferencia.
// Remove o objeto no R2 e o registro. Nunca toca em midia de post publicado.
export async function limparMidiaOrfa(agora = new Date(), idadeMinH = 24) {
  const limite = agora.getTime() - idadeMinH * 3600000;
  // filtro em JS (nao depende de OR no SQL); so entra quem tem status explicito de envio/falha
  const todas = await sql<{ id: string; key: string | null; status: string | null; created_at: string }[]>`select id, key, status, created_at from media_assets`;
  const linhas = todas.filter((m) => m.status === "enviando" || m.status === "falhou");
  let removidas = 0;
  for (const m of linhas) {
    const criada = new Date(m.created_at ?? 0).getTime();
    if (m.status === "enviando" && criada > limite) continue;
    if (!m.key) continue; // sem chave no armazenamento: nada seguro para apagar
    try {
      if (m.key) await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: m.key }));
    } catch {
      // objeto ja inexistente ou armazenamento indisponivel: segue e tenta de novo no proximo ciclo
      continue;
    }
    await sql`delete from media_assets where id = ${m.id}`;
    removidas++;
  }
  return { orfasRemovidas: removidas };
}
