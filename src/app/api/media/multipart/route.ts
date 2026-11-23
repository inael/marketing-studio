import { NextResponse, type NextRequest } from "next/server";
import { respostaErro } from "@/lib/erro";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { addMedia } from "@/server/media";
import {
  iniciarMultipart,
  urlParte,
  partesRecebidas,
  concluirMultipart,
  cancelarMultipart,
  urlPublicaDe,
} from "@/server/r2-multipart";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// M45: rota do envio em partes. Acoes: iniciar, parte, status, concluir, cancelar.
const LIMITE = 500 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return respostaErro(401, "nao_autenticado", "unauthenticated");

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const acao = String(b.acao ?? "");
  const key = String(b.key ?? "");
  const uploadId = String(b.uploadId ?? "");

  try {
    if (acao === "iniciar") {
      const tipo = String(b.tipo ?? "");
      const tamanho = Number(b.tamanho);
      if (!/^(video|image)\//.test(tipo)) return respostaErro(415, "formato_invalido", "formato não aceito");
      if (!(tamanho > 0) || tamanho > LIMITE) return respostaErro(413, "arquivo_grande", "arquivo acima de 500MB");
      const ext = (String(b.nome ?? "").split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      const novaKey = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const id = await iniciarMultipart(novaKey, tipo);
      return NextResponse.json({ key: novaKey, uploadId: id });
    }
    if (acao === "parte") {
      return NextResponse.json({ url: await urlParte(key, uploadId, Number(b.numero)) });
    }
    if (acao === "status") {
      return NextResponse.json({ partes: await partesRecebidas(key, uploadId) });
    }
    if (acao === "concluir") {
      const partes = (b.partes as { numero: number; etag: string }[]) ?? [];
      await concluirMultipart(key, uploadId, partes);
      const url = urlPublicaDe(key);
      const tipo = String(b.tipo ?? "");
      await addMedia({
        brand_id: String(b.brand_id ?? "") || null,
        url,
        tipo: tipo.startsWith("video/") ? "video" : "image",
        origem: "upload",
      });
      return NextResponse.json({ url });
    }
    if (acao === "cancelar") {
      await cancelarMultipart(key, uploadId);
      return NextResponse.json({ ok: true });
    }
    return respostaErro(400, "acao_invalida", "ação inválida");
  } catch (e) {
    return respostaErro(500, "falha_interna", e instanceof Error ? e.message : "falha no envio");
  }
}
