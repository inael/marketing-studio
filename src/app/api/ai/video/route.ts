import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { hfGenerate } from "@/server/higgsfield";
import { saveRemoteMedia } from "@/server/media";
import { DEFAULT_VIDEO_MODEL } from "@/lib/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // vídeo demora mais que imagem

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    image_url?: string;
    prompt?: string;
    brand_id?: string;
    duration?: number;
    model?: string;
  };
  if (!body.image_url) {
    return NextResponse.json({ error: "escolha uma imagem base" }, { status: 400 });
  }
  const prompt = body.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "descreva o movimento" }, { status: 400 });

  const r = await hfGenerate(
    body.model || DEFAULT_VIDEO_MODEL,
    { image_url: body.image_url, prompt, duration: body.duration || 5 },
    280_000
  );
  if (r.error || !r.videoUrl) {
    return NextResponse.json({ error: r.error ?? "sem vídeo" }, { status: 502 });
  }

  const url = await saveRemoteMedia(r.videoUrl, body.brand_id || null, "higgsfield-video");
  return NextResponse.json({ url });
}
