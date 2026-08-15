import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getAiConfig } from "@/server/settings";
import { generateSuggestionsById } from "@/server/planner";
import { addSuggestions } from "@/server/suggestions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const cfg = await getAiConfig();
  if (!cfg) return NextResponse.json({ error: "IA de texto não configurada em Config." }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    brand_id?: string;
    feedback?: string;
    fonte?: "noticia" | "concorrente" | "twitter";
  };
  if (!body.brand_id) return NextResponse.json({ error: "marca inválida" }, { status: 400 });

  const result = await generateSuggestionsById(body.brand_id, cfg, {
    fonte: body.fonte,
    feedback: body.feedback,
  });
  if (!result) return NextResponse.json({ error: "marca inválida" }, { status: 400 });

  if (!result.noticias.length && !result.concorrentes.length && !result.twitters.length) {
    const msg =
      body.fonte === "twitter"
        ? "Sem sugestões do Twitter/X — o microserviço não está configurado/conectado ou não trouxe tweets."
        : "o time não conseguiu montar sugestões, tente de novo";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // persiste — as sugestões ficam salvas mesmo se o usuário trocar de menu
  const [noticias, concorrentes, twitters] = await Promise.all([
    addSuggestions(body.brand_id, "noticia", result.noticias),
    addSuggestions(body.brand_id, "concorrente", result.concorrentes),
    addSuggestions(body.brand_id, "twitter", result.twitters),
  ]);

  return NextResponse.json({ noticias, concorrentes, twitters, analysts: result.analysts, meta: result.meta });
}
