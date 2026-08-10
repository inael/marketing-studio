import Link from "next/link";
import { listPosts, type Post } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function ymOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function addMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  return ymOf(new Date(y, m - 1 + delta, 1));
}
function hhmm(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const now = new Date();
  const { ym: ymParam } = await searchParams;
  const ym = /^\d{4}-\d{2}$/.test(ymParam ?? "") ? ymParam! : ymOf(now);
  const [y, m] = ym.split("-").map(Number);

  const [posts, brands] = await Promise.all([listPosts(), listAllBrands()]);
  const byId = new Map(brands.map((b) => [b.id, b]));

  const byDay = new Map<number, Post[]>();
  for (const p of posts) {
    if (!p.scheduled_at) continue;
    const d = new Date(p.scheduled_at);
    if (d.getFullYear() === y && d.getMonth() === m - 1) {
      const arr = byDay.get(d.getDate()) ?? [];
      arr.push(p);
      byDay.set(d.getDate(), arr);
    }
  }

  const first = new Date(y, m - 1, 1);
  const startDow = (first.getDay() + 6) % 7; // Seg = 0
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(first);
  const isToday = (d: number) =>
    now.getFullYear() === y && now.getMonth() === m - 1 && now.getDate() === d;

  const navBtn = "grid h-8 w-8 place-items-center rounded-md border border-line text-dim transition-colors hover:border-line2 hover:text-ink";

  return (
    <>
      <PageHeader
        title="Calendário"
        subtitle="Posts agendados por marca"
        action={
          <div className="flex items-center gap-2">
            <Link href={`/calendario?ym=${addMonth(ym, -1)}`} className={navBtn} aria-label="Mês anterior">
              ‹
            </Link>
            <span className="min-w-40 text-center text-sm capitalize text-ink">{monthLabel}</span>
            <Link href={`/calendario?ym=${addMonth(ym, 1)}`} className={navBtn} aria-label="Próximo mês">
              ›
            </Link>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-7 border-b border-line bg-panel">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-3 py-2 text-xs font-medium text-faint">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const dayPosts = d ? byDay.get(d) ?? [] : [];
            return (
              <div
                key={i}
                className={`min-h-28 border-b border-r border-line p-1.5 ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${d ? "bg-canvas" : "bg-panel/30"}`}
              >
                {d && (
                  <>
                    <div className="mb-1 flex justify-end">
                      <span
                        className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs ${
                          isToday(d) ? "bg-ink font-semibold text-canvas" : "text-faint"
                        }`}
                      >
                        {d}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((p) => {
                        const b = byId.get(p.brand_id);
                        return (
                          <div
                            key={p.id}
                            title={`${b?.nome ?? ""} · ${p.scheduled_at ? hhmm(p.scheduled_at) : ""} · ${p.legenda || "(sem legenda)"}`}
                            className="flex items-center gap-1.5 rounded bg-panel px-1.5 py-1 text-[11px]"
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: b?.cor_principal ?? "#3a3a40" }}
                            />
                            <span className="font-mono text-faint">
                              {p.scheduled_at ? hhmm(p.scheduled_at) : ""}
                            </span>
                            <span className="truncate text-dim">{p.legenda || "sem legenda"}</span>
                          </div>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <div className="px-1.5 text-[11px] text-faint">+{dayPosts.length - 3}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
