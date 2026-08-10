import Link from "next/link";
import { redirect } from "next/navigation";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { AppNav } from "@/components/app-nav";
import { initials } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");

  const who = claims?.email ?? claims?.name ?? claims?.sub ?? "conta";

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-line bg-panel">
        <Link href="/posts" className="flex flex-col gap-0.5 px-6 pb-5 pt-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
            IT Booster
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Marketing Studio
          </span>
        </Link>

        <div className="mt-1 flex-1 overflow-y-auto pb-4">
          <AppNav />
        </div>

        <div className="border-t border-line px-3 py-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel2 text-[11px] font-semibold text-dim">
              {initials(String(who))}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-dim" title={String(who)}>
              {who}
            </span>
          </div>
          <Link
            href="/logto/sign-out"
            className="mt-1 block rounded-md px-3 py-2 text-xs text-faint transition-colors hover:bg-panel2 hover:text-dim"
          >
            Sair
          </Link>
        </div>
      </aside>

      <main className="pl-60">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
