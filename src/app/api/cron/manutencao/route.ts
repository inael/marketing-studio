import { NextResponse, type NextRequest } from "next/server";
import { conciliarEstado, limparMidiaOrfa } from "@/server/manutencao";
import { renovarTokensVencendo } from "@/server/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// B36 + B49: manutencao diaria. Protegida por CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const conc = await conciliarEstado();
  const orf = await limparMidiaOrfa();
  const tok = await renovarTokensVencendo();
  return NextResponse.json({ ...conc, ...orf, tokens: tok });
}
