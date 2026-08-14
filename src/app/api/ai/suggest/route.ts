import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { generateSuggestionsById } from "@/server/planner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const cfg = await getAiConfig();
  if (!cfg) return NextResponse.json({ error: "IA de texto não configurada em Config." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { brand_id?: string; feedback?: string };
  if (!body.brand_id) return NextResponse.json({ error: "marca inválida" }, { status: 400 });

  const result = await generateSuggestionsById(body.brand_id, cfg, body.feedback);
  if (!result) return NextResponse.json({ error: "marca inválida" }, { status: 400 });

  if (!result.noticias.length && !result.concorrentes.length) {
    return NextResponse.json({ error: "o time não conseguiu montar sugestões, tente de novo" }, { status: 502 });
  }

  return NextResponse.json(result);
}
