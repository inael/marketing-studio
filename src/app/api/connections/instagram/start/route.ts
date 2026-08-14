import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export async function GET(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.redirect(new URL("/logto/sign-in", req.url));

  const appId = process.env.META_OAUTH_APP_ID;
  if (!appId) return NextResponse.json({ error: "META_OAUTH_APP_ID não configurado" }, { status: 500 });

  const slug = req.nextUrl.searchParams.get("brand") ?? "";
  const base = process.env.LOGTO_BASE_URL ?? req.nextUrl.origin;
  const redirect = `${base}/api/connections/instagram/callback`;

  const url =
    `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&state=${encodeURIComponent(slug)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;

  return NextResponse.redirect(url);
}
