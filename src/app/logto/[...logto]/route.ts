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
      });
      return NextResponse.json({ ok: true });
    case "callback":
      await handleSignIn(logtoConfig, request.nextUrl.searchParams);
      return NextResponse.json({ ok: true });
    case "sign-out":
      await signOut(logtoConfig, `${logtoConfig.baseUrl}/`);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
}
