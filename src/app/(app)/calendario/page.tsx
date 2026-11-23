import Link from "next/link";
import { getMarcaAtivaSlug } from "@/server/marca-ativa";
import { listPosts, type Post } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { PageHeader } from "@/components/ui";
import { SemanaGrid } from "@/components/semana-grid";

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
  searchParams: Promise<{ ym?: string; brand?: string; vista?: string; sem?: string }>;
}) {
  const now = new Date();
  const { ym: ymParam, brand: brandParam, vista: vistaParam, sem: semParam } = await searchParams;
  const brandSlug = brandParam ?? (await getMarcaAtivaSlug()) ?? undefined;
  const ym = /^\d{4}-\d{2}$/.test(ymParam ?? "") ? ymParam! : ymOf(now);
  const [y, m] = ym.split("-").map(Number);

  const [allPosts, brands] = await Promise.all([listPosts(), listAllBrands()]);
  const byId = new Map(brands.map((b) => [b.id, b]));
  const activeBrand = brandSlug ? brands.find((b) => b.slug === brandSlug) : undefined;
  const posts = activeBrand ? allPosts.filter((p) => p.brand_id === activeBrand.id) : allPosts;
  const brandQ = activeBrand ? `&brand=${activeBrand.slug}` : "";

  // D17: contagem por marca no mes e deteccao de lacunas (3+ dias sem post, marca escolhida)
  const noMes = (iso: string | null) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === y && d.getMonth() === m - 1;
  };
  const porMarca = brands.map((b) => ({
    b,
    n: allPosts.filter((p) => p.brand_id === b.id && noMes(p.scheduled_at)).length,
  }));
  const mesmoDia = (iso: string, ts: number) => {
    const a = new Date(iso);
    const t = new Date(ts);
    return a.getFullYear() === t.getFullYear() && a.getMonth() === t.getMonth() && a.getDate() === t.getDate();
  };
  const brandPosts = activeBrand ? allPosts.filter((p) => p.brand_id === activeBrand.id && p.scheduled_at) : [];
  const temPost = (ts: number) => brandPosts.some((p) => mesmoDia(p.scheduled_at as string, ts));
  const lacunaDia = (d: number) => {
    if (!activeBrand) return false;
    const base = new Date(y, m - 1, d).getTime();
    const dia = 24 * 60 * 60 * 1000;
    return !temPost(base) && !temPost(base - dia) && !temPost(base - 2 * dia) && !temPost(base - 3 * dia);
  };

  // D18: visao semanal em linha do tempo (horas x dias)
  if (vistaParam === "semana") {
    const base = semParam && /^d{4}-d{2}-d{2}$/.test(semParam) ? new Date(semParam + "T12:00:00") : new Date();
    const seg = new Date(base);
    seg.setHours(0, 0, 0, 0);
    seg.setDate(seg.getDate() - ((seg.getDay() + 6) % 7));
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(seg);
      d.setDate(seg.getDate() + i);
      return d;
    });
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const prev = new Date(seg);
    prev.setDate(seg.getDate() - 7);
    const next = new Date(seg);
    next.setDate(seg.getDate() + 7);
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const horas = Array.from({ length: 15 }, (_, i) => 8 + i); // 08h..22h
    // D18: dados da grade (dia local e hora de cada post dentro da semana)
    const diasView = dias.map((d) => ({
      iso: iso(d),
      rotulo: `${d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")} ${fmt(d)}`,
    }));
    const isoDias = new Set(diasView.map((d) => d.iso));
    const itensView = posts
      .filter((p) => p.scheduled_at)
      .map((p) => {
        const t = new Date(p.scheduled_at as string);
        const b = byId.get(p.brand_id);
        return {
          id: p.id,
          dia: iso(t),
          hora: t.getHours(),
          hm: hhmm(p.scheduled_at as string),
          nome: b?.nome ?? "?",
          cor: b?.cor_principal ?? "#3a3a40",
          legenda: p.legenda ?? "",
        };
      })
      .filter((x) => isoDias.has(x.dia));
    const navW = "grid h-8 w-8 place-items-center rounded-md border border-line text-dim transition-colors hover:border-line2 hover:text-ink";
    return (
      <>
        <PageHeader
          title="Calendário"
          subtitle={`Semana de ${fmt(dias[0])} a ${fmt(dias[6])}${activeBrand ? ` · ${activeBrand.nome}` : ""}`}
          action={
            <div className="flex items-center gap-2">
              <Link href={`/calendario?vista=semana&sem=${iso(prev)}${brandQ}`} className={navW} aria-label="Semana anterior">‹</Link>
              <Link href={`/calendario?vista=semana${brandQ}`} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-ink">Hoje</Link>
              <Link href={`/calendario?vista=semana&sem=${iso(next)}${brandQ}`} className={navW} aria-label="Próxima semana">›</Link>
              <Link href={`/calendario?ym=${ymOf(seg)}${brandQ}`} className="ml-2 rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-ink">Mês</Link>
              <span className="rounded-md border border-line2 bg-panel2 px-2.5 py-1.5 text-xs text-ink">Semana</span>
            </div>
          }
        />
        <SemanaGrid dias={diasView} horas={horas} itens={itensView} />
      </>
    );
  }

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
        subtitle={activeBrand ? `Agenda de ${activeBrand.nome}` : "Agenda de todos os produtos"}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/calendario?ym=${addMonth(ym, -1)}${brandQ}`} className={navBtn} aria-label="Mês anterior">
              ‹
            </Link>
            <span className="min-w-40 text-center text-sm capitalize text-ink">{monthLabel}</span>
            <Link href={`/calendario?ym=${addMonth(ym, 1)}${brandQ}`} className={navBtn} aria-label="Próximo mês">
              ›
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/calendario?ym=${ym}`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            !activeBrand ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
          }`}
        >
          Todos os produtos
        </Link>
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/calendario?ym=${ym}&brand=${b.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
              activeBrand?.id === b.id ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: b.cor_principal }} />
            {b.nome}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="space-y-2 text-xs">
        <div className="text-[11px] uppercase tracking-wide text-faint">Marcas no mês</div>
        <ul className="space-y-1">
          {porMarca.map((x) => (
            <li key={x.b.id}>
              <Link href={`/calendario?ym=${ym}&brand=${x.b.slug}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-dim transition-colors hover:bg-panel2 hover:text-ink">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: x.b.cor_principal }} />
                <span className="min-w-0 flex-1 truncate">{x.b.nome}</span>
                <span className="text-faint">{x.n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-w-0">
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
                className={`min-h-16 border-b border-r border-line p-1 md:min-h-28 md:p-1.5 ${
                  i % 7 === 6 ? "border-r-0" : ""
                } ${d ? (dayPosts.length ? "bg-canvas" : "bg-canvas/60") : "bg-panel/30"}`}
              >
                {d && (
                  <>
                    <div className="mb-1 flex items-center justify-end gap-1.5">
                      {lacunaDia(d) && (
                        <span className="text-[10px] text-warn" title="Esta marca ficou sem post há mais de 3 dias">lacuna</span>
                      )}
                      <span
                        className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs ${
                          isToday(d) ? "bg-ink font-semibold text-canvas" : "text-faint"
                        }`}
                      >
                        {d}
                      </span>
                    </div>
                    {/* M11: no celular, uma barra fina por marca, com altura pelo numero de posts */}
                    {dayPosts.length > 0 && (
                      <div className="mb-1 flex items-end gap-0.5 md:hidden">
                        {Array.from(new Set(dayPosts.map((p) => p.brand_id))).map((bid) => {
                          const n = dayPosts.filter((p) => p.brand_id === bid).length;
                          return (
                            <span
                              key={bid}
                              className="w-1.5 rounded-t"
                              style={{ height: `${Math.min(n, 4) * 5 + 4}px`, background: byId.get(bid)?.cor_principal ?? "#3a3a40" }}
                              title={`${byId.get(bid)?.nome ?? ""}: ${n}`}
                            />
                          );
                        })}
                      </div>
                    )}
                    {dayPosts.length > 0 && (
                      <Link
                        href={`/calendario?vista=semana&sem=${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`}
                        className="block min-h-11 text-[11px] text-info md:hidden"
                      >
                        {dayPosts.length} post(s) · ver a semana
                      </Link>
                    )}
                    <div className="hidden space-y-1 md:block">
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
                            {/* D43: post que falhou aparece em vermelho no dia e na hora em que deveria sair */}
                            {p.status === "failed" ? (
                              <span className="truncate text-bad">falhou · {p.erro ? p.erro.slice(0, 40) : "motivo não registrado"}</span>
                            ) : (
                              <span className="truncate text-dim">{p.legenda || "sem legenda"}</span>
                            )}
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
      </div>
      </div>
    </>
  );
}
