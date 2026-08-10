import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { uploadPublic } from "@/server/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Upload de mídia -> R2 (bucket público). Retorna a URL pública pra usar no post.
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "arquivo ausente" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "só imagens por enquanto" }, { status: 415 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "imagem acima de 12MB" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await uploadPublic(buf, key, file.type);
  return NextResponse.json({ url });
}
