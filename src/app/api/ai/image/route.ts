import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getHiggsfield } from "@/server/settings";
import { uploadPublic } from "@/server/r2";
import { addMedia } from "@/server/media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Gera imagem via Higgsfield (assíncrono: submete -> faz polling -> baixa ->
// sobe pro R2 -> salva na biblioteca). Retorna a URL pública.
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const cfg = await getHiggsfield();
  if (!cfg) {
    return NextResponse.json(
      { error: "Higgsfield não configurado (key + secret) em Config." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    brand_id?: string;
    aspect_ratio?: string;
  };
  const prompt = body.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "descreva a imagem" }, { status: 400 });

  const auth = `Key ${cfg.apiKey}:${cfg.apiSecret}`;
  const base = "https://platform.higgsfield.ai";

  try {
    let res = await fetch(`${base}/${cfg.model}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        prompt,
        aspect_ratio: body.aspect_ratio || "1:1",
        resolution: "1080p",
      }),
    });
    let data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? data?.message ?? `Higgsfield retornou ${res.status}` },
        { status: 502 }
      );
    }

    // polling até completar (ou ~50s)
    let imageUrl: string | undefined = data?.images?.[0]?.url;
    const statusUrl: string | undefined = data?.status_url;
    const deadline = Date.now() + 50_000;
    while (!imageUrl && statusUrl && data?.status !== "failed" && Date.now() < deadline) {
      await sleep(3000);
      res = await fetch(statusUrl, { headers: { Authorization: auth, Accept: "application/json" } });
      data = await res.json().catch(() => ({}));
      if (data?.status === "completed") imageUrl = data?.images?.[0]?.url;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: data?.status === "failed" ? "geração falhou" : "geração demorou, tente de novo" },
        { status: 504 }
      );
    }

    // baixa a imagem e sobe pro R2 (Meta precisa de URL pública nossa)
    const img = await fetch(imageUrl);
    const buf = Buffer.from(await img.arrayBuffer());
    const ct = img.headers.get("content-type") || "image/jpeg";
    const ext = ct.includes("png") ? "png" : "jpg";
    const key = `posts/hf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const url = await uploadPublic(buf, key, ct);
    await addMedia({ brand_id: body.brand_id || null, url, tipo: "image", origem: "higgsfield" });

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha ao gerar imagem" },
      { status: 502 }
    );
  }
}
