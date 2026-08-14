import { NextResponse, type NextRequest } from "next/server";
import { managerAutopilot } from "@/server/automation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // pode publicar (inclui reel/story em vídeo)

// Cron do gestor: auto-aprova e publica o melhor rascunho automático com mídia.
// Protegido por CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await managerAutopilot();
  return NextResponse.json(result);
}
