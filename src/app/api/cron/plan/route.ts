import { NextResponse, type NextRequest } from "next/server";
import { planMorning } from "@/server/automation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // gera sugestões pra todas as marcas (LLM, lento)

// Cron da manhã: cria rascunhos automáticos por marca. Protegido por CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await planMorning();
  return NextResponse.json(result);
}
