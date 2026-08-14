import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Community Management API: postar na Página de empresa (organization)
const SCOPES = "openid profile w_organization_social rw_organization_admin";

export async function GET(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.redirect(new URL("/logto/sign-in", req.url));

  const clientId = process.env.LINKEDIN_OAUTH_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "LINKEDIN_OAUTH_CLIENT_ID não configurado" }, { status: 500 });

  const slug = req.nextUrl.searchParams.get("brand") ?? "";
  const base = process.env.LOGTO_BASE_URL ?? req.nextUrl.origin;
  const redirect = `${base}/api/connections/linkedin/callback`;

  const url =
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    `&state=${encodeURIComponent(slug)}` +
    `&scope=${encodeURIComponent(SCOPES)}`;

  return NextResponse.redirect(url);
}
