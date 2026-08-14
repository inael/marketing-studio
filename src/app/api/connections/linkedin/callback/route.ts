import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createOauthSession } from "@/server/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const clientId = process.env.LINKEDIN_OAUTH_CLIENT_ID!;
  const secret = process.env.LINKEDIN_OAUTH_CLIENT_SECRET!;
  const base = process.env.LOGTO_BASE_URL ?? req.nextUrl.origin;
  const redirect = `${base}/api/connections/linkedin/callback`;

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect,
        client_id: clientId,
        client_secret: secret,
      }),
    });
    const tok = await tokenRes.json();
    if (!tok.access_token) throw new Error(tok.error_description ?? tok.error ?? "não obtive o token");
    const token = tok.access_token as string;

    // organizações (Páginas de empresa) que o usuário administra
    const aclRes = await fetch(
      "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organization~(id,localizedName)))",
      { headers: { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" } }
    );
    const acl = await aclRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgs = (acl.elements ?? []).map((e: any) => {
      const org = e["organization~"] ?? {};
      return { orgId: e.organization as string, name: org.localizedName ?? e.organization, token };
    });

    if (!orgs.length) {
      return htmlClose(
        "Nenhuma Página de empresa que você administra foi encontrada, ou o produto Community Management API ainda não está aprovado no app do LinkedIn."
      );
    }

    const sessionId = await createOauthSession("linkedin", { kind: "linkedin", slug, orgs });
    return NextResponse.redirect(`${base}/marcas/${slug}/conectar?s=${sessionId}`);
  } catch (e) {
    return htmlClose(`Erro ao conectar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
