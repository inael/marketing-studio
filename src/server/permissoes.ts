import { sql } from "./db";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

// B03: uma regra so. Sem vinculo com a marca, a acao e negada antes de qualquer regra de negocio.
export type Acao = "ver" | "editar" | "aprovar" | "publicar";
export class AcessoNegado extends Error {
  constructor(public motivo: string) {
    super(motivo);
  }
}

// quem pode o que: analista cria e edita rascunho; so gestor aprova e publica
const PODE: Record<Acao, string[]> = {
  ver: ["gestor", "analista"],
  editar: ["gestor", "analista"],
  aprovar: ["gestor"],
  publicar: ["gestor"],
};

export async function usuarioAtual(): Promise<string | null> {
  const ctx = await getLogtoContext(logtoConfig);
  if (!ctx.isAuthenticated) return null;
  const c = ctx.claims as { sub?: string; email?: string } | undefined;
  return c?.sub ?? c?.email ?? null;
}

async function registrar(usuario: string | null, marca: string, rota: string, resultado: string) {
  try {
    await sql`insert into audit_log (user_id, brand_id, rota, resultado) values (${usuario}, ${marca}, ${rota}, ${resultado})`;
  } catch {
    // auditoria nao pode derrubar a acao principal
  }
}

/** Confere o vinculo do usuario com a marca e a acao. Lanca AcessoNegado se nao puder. */
export async function exigirMarca(brandId: string, acao: Acao, rota = "ação"): Promise<string> {
  const usuario = await usuarioAtual();
  if (!usuario) throw new AcessoNegado("sessão expirada");
  const [v] = await sql<{ role: string }[]>`select role from brand_members where user_id = ${usuario} and brand_id = ${brandId}`;
  if (!v) {
    await registrar(usuario, brandId, rota, "negado: sem vínculo");
    throw new AcessoNegado("você não tem acesso a esta marca");
  }
  if (!PODE[acao].includes(v.role)) {
    await registrar(usuario, brandId, rota, `negado: papel ${v.role} não pode ${acao}`);
    throw new AcessoNegado(`seu papel (${v.role}) pode ver, mas não ${acao === "aprovar" ? "aprovar" : acao === "publicar" ? "publicar" : "editar"} esta marca`);
  }
  return v.role;
}

// B40: registro de auditoria das alteracoes (quem, o que, em qual marca/alvo, quando)
export async function auditar(acao: string, alvo: string, marcaId: string | null = null) {
  try {
    const usuario = await usuarioAtual();
    await sql`insert into audit_log (user_id, brand_id, rota, resultado) values (${usuario}, ${marcaId}, ${acao}, ${"ok: " + alvo})`;
  } catch {
    // auditoria nao derruba a acao
  }
}
