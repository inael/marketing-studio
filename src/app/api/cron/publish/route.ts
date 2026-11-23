import { NextResponse, type NextRequest } from "next/server";
import { rodarJob } from "@/server/publicacao-job";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // pode publicar reel/story (video, lento)

// B11: job a cada 15 min. Protegido por CRON_SECRET (a Vercel envia Authorization: Bearer <CRON_SECRET>).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await rodarJob());
}
