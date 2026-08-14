import { redirect } from "next/navigation";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { SideNav } from "@/components/side-nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, claims, userInfo } = await getLogtoContext(logtoConfig, {
    fetchUserInfo: true,
  });
  if (!isAuthenticated) redirect("/logto/sign-in");

  const who = userInfo?.name ?? claims?.name ?? claims?.email ?? claims?.sub ?? "conta";
  const picture = (userInfo?.picture ?? claims?.picture) as string | undefined;

  return (
    <div className="min-h-screen">
      <SideNav who={String(who)} picture={picture} />
      <main className="pl-64">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
