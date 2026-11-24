"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agendarSerie } from "./actions";

type Marca = { id: string; nome: string; cor: string };
type Rascunho = { id: string; brand_id: string; legenda: string; tipo: string };

const RITMOS = [
  { v: 1, label: "Diário" },
  { v: 2, label: "A cada 2 dias" },
  { v: 7, label: "Semanal" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function SerieForm({ marcas, rascunhos }: { marcas: Marca[]; rascunhos: Rascunho[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [marca, setMarca] = useState(marcas[0]?.id ?? "");
  const [ritmo, setRitmo] = useState(2);
  const [hora, setHora] = useState("18:00");
  const [inicio, setInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [datas, setDatas] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const daMarca = rascunhos.filter((r) => r.brand_id === marca);

  // datas sugeridas pelo ritmo, na ordem em que os posts foram escolhidos
  const sugeridas = useMemo(() => {
    const out: Record<string, string> = {};
    const base = new Date(`${inicio}T${hora}:00`);
    escolhidos.forEach((id, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i * ritmo);
      out[id] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${hora}`;
    });
    return out;
  }, [escolhidos, inicio, hora, ritmo]);

  const dataDe = (id: string) => datas[id] ?? sugeridas[id] ?? "";

  const alternar = (id: string) =>
    setEscolhidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  const confirmar = () =>
    start(async () => {
      const itens = escolhidos.map((id) => ({ id, quando: new Date(dataDe(id)).toISOString() }));
      const r = await agendarSerie(marca, itens);
      setMsg(r.ok ? { ok: true, text: `${r.agendados} post(s) agendado(s).` } : { ok: false, text: r.error });
      if (r.ok) {
        setEscolhidos([]);
        router.refresh();
      }
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-6">
        {/* 1 · marca */}
        <section className="rounded-xl border border-line bg-panel p-5">
          <header className="mb-4 flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warn text-xs font-bold text-canvas">1</span>
            <h2 className="text-sm font-semibold text-ink">Marca</h2>
          </header>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {marcas.map((m) => {
              const on = marca === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setMarca(m.id);
                    setEscolhidos([]);
                  }}
                  className={`relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    on ? "border-warn bg-panel2 text-ink" : "border-line bg-panel2/40 text-dim hover:border-line2 hover:text-ink"
                  }`}
                >
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: m.cor }} />
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-canvas" style={{ background: m.cor }}>{m.nome.charAt(0)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{m.nome}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2 · ritmo, horário e início */}
        <section className="rounded-xl border border-line bg-panel p-5">
          <header className="mb-4 flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warn text-xs font-bold text-canvas">2</span>
            <h2 className="text-sm font-semibold text-ink">Ritmo e horário</h2>
          </header>
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Ritmo</div>
              <div className="grid grid-cols-3 gap-2">
                {RITMOS.map((r) => {
                  const on = ritmo === r.v;
                  return (
                    <button
                      key={r.v}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setRitmo(r.v)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                        on ? "border-warn bg-panel2 text-ink" : "border-line text-dim hover:border-line2 hover:text-ink"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16M4 15h16M7 4v16M17 4v16" /></svg>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
                Horário
                <span className="relative mt-2 block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
                  </span>
                  <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="min-h-11 w-full rounded-lg border border-line bg-panel2 pl-9 pr-3 text-sm normal-case tracking-normal text-ink" />
                </span>
              </label>
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
                Início
                <span className="relative mt-2 block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
                  </span>
                  <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="min-h-11 w-full rounded-lg border border-line bg-panel2 pl-9 pr-3 text-sm normal-case tracking-normal text-ink" />
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* 3 · rascunhos da marca */}
        <section className="rounded-xl border border-line bg-panel p-5">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-warn text-xs font-bold text-canvas">3</span>
              <h2 className="text-sm font-semibold text-ink">Rascunhos da marca</h2>
            </div>
            <span className="rounded-full bg-panel2 px-2.5 py-0.5 text-xs text-dim">{daMarca.length}</span>
          </header>
          {daMarca.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-6 text-xs text-faint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5M12 16h.01" /><circle cx="12" cy="12" r="8.5" /></svg>
              Nenhum rascunho com mídia nesta marca.
            </p>
          ) : (
            <ul className="space-y-2">
              {daMarca.map((r) => {
                const on = escolhidos.includes(r.id);
                return (
                  <li key={r.id}>
                    <label className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      on ? "border-warn bg-panel2 text-ink" : "border-line bg-panel2/40 text-dim hover:border-line2"
                    }`}>
                      <input type="checkbox" checked={on} onChange={() => alternar(r.id)} className="h-4 w-4 accent-[var(--color-warn)]" />
                      <span className="min-w-0 flex-1 truncate">{r.legenda?.trim() || "post sem legenda"}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* datas: a linha do tempo do agendamento */}
      <aside className="space-y-4 rounded-xl border border-line bg-panel p-5 lg:sticky lg:top-6">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Datas</h2>
          <span className="rounded-full bg-panel2 px-2.5 py-0.5 text-xs text-dim">{escolhidos.length}</span>
        </header>
        {escolhidos.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-8 text-center text-xs text-faint">
            Escolha os posts da marca para ver as datas aqui.
          </p>
        ) : (
          <ol className="relative space-y-2 border-l border-line pl-5">
            {escolhidos.map((id, i) => {
              const post = daMarca.find((r) => r.id === id);
              return (
                <li key={id} className="relative flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel2/40 p-3 text-sm">
                  <span className="absolute -left-[27px] top-4 grid h-5 w-5 place-items-center rounded-full bg-warn text-[10px] font-bold text-canvas">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-dim">{post?.legenda?.trim() || "post sem legenda"}</span>
                  <input
                    type="datetime-local"
                    value={dataDe(id)}
                    onChange={(e) => setDatas((d) => ({ ...d, [id]: e.target.value }))}
                    className="min-h-11 rounded-lg border border-line bg-panel px-2 text-xs text-ink"
                  />
                </li>
              );
            })}
          </ol>
        )}
        {msg && <p className={`rounded-lg border px-3 py-2 text-xs ${msg.ok ? "border-ok/30 bg-ok/10 text-ok" : "border-bad/30 bg-bad/10 text-bad"}`}>{msg.text}</p>}
        <button
          type="button"
          onClick={confirmar}
          disabled={pending || escolhidos.length === 0}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-warn px-4 text-sm font-semibold text-canvas disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4 10-10" /></svg>
          {pending ? "agendando…" : `Agendar ${escolhidos.length} post(s)`}
        </button>
      </aside>
    </div>
  );
}
