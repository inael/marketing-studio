import { NextResponse, type NextRequest } from "next/server";
import { respostaErro } from "@/lib/erro";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { conferirObjeto, marcarPronta, marcarFalhou } from "@/server/media-presign";
import { validarPorRede, type Rede } from "@/server/midia-regras";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// B05: o navegador avisa que enviou. O servidor confere tamanho e tipo antes de marcar pronta.
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return respostaErro(401, "nao_autenticado", "unauthenticated");
  const b = (await req.json().catch(() => ({}))) as { id?: string; key?: string; tamanho?: number; mime?: string; largura?: number; altura?: number; duracao?: number; rede?: Rede };
  if (!b.id || !b.key) return respostaErro(400, "dados_ausentes", "registro ausente");
  try {
    const r = await conferirObjeto(b.key, Number(b.tamanho), String(b.mime));
    if (!r.ok) {
      await marcarFalhou(b.id);
      return NextResponse.json({ error: r.motivo }, { status: 422 });
    }
    // B06: regras da rede de destino; todos os problemas de uma vez
    const tipo = String(b.mime).startsWith("video/") ? "video" : "image";
    const problemas = validarPorRede({ tipo, largura: b.largura, altura: b.altura, duracao: b.duracao }, b.rede ?? (tipo === "video" ? "instagram_reel" : "instagram_feed"));
    if (problemas.length > 0) {
      await marcarFalhou(b.id);
      return NextResponse.json({ error: "mídia fora das regras", problemas }, { status: 422 });
    }
    await marcarPronta(b.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return respostaErro(500, "falha_interna", e instanceof Error ? e.message : "falha ao conferir");
  }
}
