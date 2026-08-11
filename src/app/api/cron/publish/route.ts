import { NextResponse, type NextRequest } from "next/server";
import { listDueScheduled, setPostStatus } from "@/server/posts";
import { publishPost } from "@/server/publish";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Publica os posts agendados cujo horário já venceu. Chamado pelo Vercel Cron.
// Protegido por CRON_SECRET (a Vercel envia Authorization: Bearer <CRON_SECRET>).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const due = await listDueScheduled(new Date().toISOString());
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const p of due) {
    // publishPost exige status 'approved'
    await setPostStatus(p.id, "approved");
    const r = await publishPost(p.id);
    results.push(r.ok ? { id: p.id, ok: true } : { id: p.id, ok: false, error: r.error });
  }

  return NextResponse.json({ processed: due.length, results });
}
