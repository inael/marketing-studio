import { NextResponse } from "next/server";

// B46: formato unico de erro das rotas. Mantem "error" (texto que a tela ja mostra) e acrescenta "codigo".
export function respostaErro(status: number, codigo: string, mensagem: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: mensagem, codigo, ...extra }, { status });
}
