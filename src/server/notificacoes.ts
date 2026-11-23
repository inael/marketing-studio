import { sql } from "./db";

// B39: aviso interno. Falha que pede acao do time, ou aviso informativo.
export async function notificar(i: { tipo: "acao" | "info"; titulo: string; detalhe?: string; href?: string }) {
  try {
    await sql`insert into notificacoes (tipo, titulo, detalhe, href, lida) values (${i.tipo}, ${i.titulo}, ${i.detalhe ?? null}, ${i.href ?? null}, ${false})`;
  } catch {
    // aviso nao pode derrubar o job
  }
}

export type Notificacao = { id: string | number; tipo: "acao" | "info"; titulo: string; detalhe: string | null; href: string | null; lida: boolean; created_at: string };

export async function listarNotificacoes(tipo?: "acao" | "info"): Promise<Notificacao[]> {
  const todas = await sql<Notificacao[]>`select * from notificacoes`;
  return todas
    .filter((n) => !n.lida && (!tipo || n.tipo === tipo))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);
}
