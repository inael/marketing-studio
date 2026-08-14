import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createOauthSession } from "@/server/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GRAPH = "https://graph.facebook.com/v21.0";

function htmlClose(msg: string) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><body style="background:#0b0b0c;color:#ededef;font-family:system-ui;padding:2rem;line-height:1.5"><p>${msg}</p><p><a href="/marcas" style="color:#60a5fa">Voltar para Marcas</a></p></body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.redirect(new URL("/logto/sign-in", req.url));

  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const slug = sp.get("state") ?? "";
  if (sp.get("error") || !code) return htmlClose("Login cancelado ou não autorizado.");

  const appId = process.env.META_OAUTH_APP_ID!;
  const secret = process.env.META_OAUTH_APP_SECRET!;
  const base = process.env.LOGTO_BASE_URL ?? req.nextUrl.origin;
  const redirect = `${base}/api/connections/instagram/callback`;

  try {
    const t1 = await (
      await fetch(
        `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
          redirect
        )}&client_secret=${secret}&code=${encodeURIComponent(code)}`
      )
    ).json();
    if (!t1.access_token) throw new Error(t1.error?.message ?? "não obtive o token");

    // token de longa duração
    const t2 = await (
      await fetch(
        `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${secret}&fb_exchange_token=${t1.access_token}`
      )
    ).json();
    const userToken = t2.access_token ?? t1.access_token;

    // páginas + conta IG business ligada a cada página (o page token publica no IG)
    const pages = await (
      await fetch(
        `${GRAPH}/me/accounts?fields=name,access_token,instagram_business_account{id,username,profile_picture_url}&limit=100&access_token=${userToken}`
      )
    ).json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = (pages.data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p.instagram_business_account)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        page: p.name,
        pageToken: p.access_token,
        igId: p.instagram_business_account.id,
        username: p.instagram_business_account.username,
        picture: p.instagram_business_account.profile_picture_url ?? null,
      }));

    if (!accounts.length) {
      return htmlClose(
        "Nenhuma conta Instagram Business encontrada nas suas Páginas. Verifique se o IG está vinculado a uma Página do Facebook."
      );
    }

    const sessionId = await createOauthSession("instagram", { slug, accounts });
    return NextResponse.redirect(`${base}/marcas/${slug}/conectar?s=${sessionId}`);
  } catch (e) {
    return htmlClose(`Erro ao conectar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
