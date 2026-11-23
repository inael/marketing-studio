import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { hfGenerate } from "@/server/higgsfield";
import { saveRemoteMedia } from "@/server/media";
import { DEFAULT_IMAGE_MODEL } from "@/lib/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  // D35: a 100% do teto mensal a geracao de imagem e pausada
  {
    const { getSettings } = await import("@/server/settings");
    const { usageReport } = await import("@/server/usage");
    const teto = Number((await getSettings())["consumo.teto"]) > 0 ? Number((await getSettings())["consumo.teto"]) : 60;
    const rep = await usageReport(30, null);
    if (rep.totals.cost >= teto) return NextResponse.json({ error: `teto mensal de US$ ${teto} atingido: a geração de imagem está pausada. Aumente o teto em Consumo ou aguarde o próximo mês.`, codigo: "teto_atingido" }, { status: 402 });
  }
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    brand_id?: string;
    aspect_ratio?: string;
    model?: string;
  };
  const prompt = body.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "descreva a imagem" }, { status: 400 });

  const r = await hfGenerate(body.model || DEFAULT_IMAGE_MODEL, {
    prompt,
    aspect_ratio: body.aspect_ratio || "1:1",
    resolution: "1080p",
  });
  if (r.error || !r.imageUrl) {
    return NextResponse.json({ error: r.error ?? "sem imagem" }, { status: 502 });
  }

  const url = await saveRemoteMedia(r.imageUrl, body.brand_id || null, "higgsfield");
  return NextResponse.json({ url });
}
