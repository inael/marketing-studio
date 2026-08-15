import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getSettings } from "@/server/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Relay pro microserviço self-host (twikit) que faz o login no X.
// O login dispara um código por email; o usuário digita e a gente confirma.
export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const base = process.env.TWITTER_SCRAPER_URL;
  const token = process.env.TWITTER_SCRAPER_TOKEN;
  if (!base) {
    return NextResponse.json(
      { error: "Microserviço do Twitter ainda não configurado (falta subir na VPS e setar TWITTER_SCRAPER_URL)." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { action?: "login" | "code" | "status"; code?: string };
  const s = await getSettings();

  try {
    if (body.action === "code") {
      const r = await fetch(`${base.replace(/\/$/, "")}/login/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ code: body.code }),
      });
      return NextResponse.json(await r.json(), { status: r.status });
    }
    if (body.action === "status") {
      const r = await fetch(`${base.replace(/\/$/, "")}/status`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      return NextResponse.json(await r.json(), { status: r.status });
    }
    // login
    if (!s.twitter_username || !s.twitter_password) {
      return NextResponse.json({ error: "Preencha usuário e senha do X acima e salve antes de conectar." }, { status: 400 });
    }
    const r = await fetch(`${base.replace(/\/$/, "")}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
      body: JSON.stringify({ username: s.twitter_username, email: s.twitter_email ?? "", password: s.twitter_password }),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "falha ao falar com o microserviço" }, { status: 502 });
  }
}
