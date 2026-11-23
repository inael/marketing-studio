import { NextResponse, type NextRequest } from "next/server";
import { respostaErro } from "@/lib/erro";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getBrandById } from "@/server/brands";
import { chaveDaMidia, mimeAceito, urlAssinada, registrarEnvio, TAMANHO_MAX } from "@/server/media-presign";
import { urlPublicaDe } from "@/server/r2-multipart";
import { checarLimite } from "@/lib/limite";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// B05: pede envio. Devolve a URL assinada e o id do registro (status enviando).
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return respostaErro(401, "nao_autenticado", "unauthenticated");
  // B45: ate 60 pedidos de envio por minuto por usuario
  const quem = (await getLogtoContext(logtoConfig)).claims?.sub ?? "anon";
  const lim = checarLimite(`presign:${quem}`, 60, 60000);
  if (!lim.ok) return NextResponse.json({ error: `muitos envios seguidos: tente em ${lim.esperarS}s` }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as { nome?: string; mime?: string; tamanho?: number; brandId?: string };
  if (!mimeAceito(String(b.mime ?? ""))) return respostaErro(415, "formato_invalido", "formato não aceito");
  const tamanho = Number(b.tamanho);
  if (!(tamanho > 0) || tamanho > TAMANHO_MAX) return respostaErro(413, "arquivo_grande", "imagem acima de 12MB");
  const marca = b.brandId ? await getBrandById(b.brandId) : null;
  if (!marca) return respostaErro(400, "marca_invalida", "marca inválida");
  const key = chaveDaMidia(marca.slug, String(b.nome ?? ""));
  const url = urlPublicaDe(key);
  const id = await registrarEnvio({ brand_id: marca.id, key, mime: String(b.mime), size: tamanho, url });
  const putUrl = await urlAssinada(key, String(b.mime));
  return NextResponse.json({ id, key, url, putUrl });
}
