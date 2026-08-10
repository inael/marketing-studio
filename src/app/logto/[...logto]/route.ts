import { NextResponse, type NextRequest } from "next/server";
import { signIn, signOut, handleSignIn } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

// Rota catch-all do App Router pro fluxo Logto (sign-in / callback / sign-out).
// As funcoes signIn/signOut/handleSignIn do @logto/next/server-actions chamam
// redirect() internamente (next/navigation), entao os NextResponse abaixo dos
// awaits sao so pra satisfazer o tipo de retorno do handler; na pratica o
// redirect acontece antes de qualquer return ser alcancado.
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logto: string[] }> }
) {
  const { logto } = await params;
  const action = logto?.[0];

  switch (action) {
    case "sign-in":
      await signIn(logtoConfig, {
        redirectUri: `${logtoConfig.baseUrl}/logto/callback`,
        // pra onde ir depois do login concluido
        postRedirectUri: `${logtoConfig.baseUrl}/posts`,
      });
      return NextResponse.json({ ok: true });
    case "callback": {
      // handleSignIn precisa da URL COMPLETA (com o path real /logto/callback)
      // pra bater com o redirectUri usado no sign-in; passar so os searchParams
      // faz o SDK assumir o path default /callback -> redirect_uri_mismatched (500).
      const callbackUrl = new URL(`${logtoConfig.baseUrl}/logto/callback`);
      callbackUrl.search = request.nextUrl.search;
      await handleSignIn(logtoConfig, callbackUrl);
      return NextResponse.json({ ok: true });
    }
    case "sign-out":
      await signOut(logtoConfig, `${logtoConfig.baseUrl}/`);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
}
