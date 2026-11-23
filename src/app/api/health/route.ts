import { NextResponse } from "next/server";
import { sql } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// B43: saude do servico. Responde 200 quando o banco responde; 503 quando nao.
// Nao expoe segredos nem versoes internas: so o estado de cada parte.
export async function GET() {
  const agora = Date.now();
  let banco: "ok" | "falhou" = "ok";
  let latenciaMs = 0;
  try {
    const t0 = Date.now();
    await sql`select 1 as ok`;
    latenciaMs = Date.now() - t0;
  } catch {
    banco = "falhou";
  }
  const corpo = {
    status: banco === "ok" ? "ok" : "indisponivel",
    em: new Date(agora).toISOString(),
    partes: {
      banco: { estado: banco, latenciaMs },
      armazenamento: { estado: process.env.R2_BUCKET ? "configurado" : "nao_configurado" },
      ia_texto: { estado: "ok" },
    },
  };
  return NextResponse.json(corpo, { status: banco === "ok" ? 200 : 503 });
}
