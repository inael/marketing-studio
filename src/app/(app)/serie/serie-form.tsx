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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium text-dim">Marca</div>
          <div className="flex flex-wrap gap-2">
            {marcas.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMarca(m.id);
                  setEscolhidos([]);
                }}
                className={`min-h-11 rounded-md border px-3 text-sm ${marca === m.id ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"}`}
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: m.cor }} />
                {m.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="mb-2 text-xs font-medium text-dim">Ritmo</div>
            <div className="flex flex-wrap gap-2">
              {RITMOS.map((r) => (
                <button key={r.v} type="button" onClick={() => setRitmo(r.v)} className={`min-h-11 rounded-md border px-3 text-xs ${ritmo === r.v ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <label className="text-xs text-dim">
            Horário
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-line bg-panel2 px-3 text-sm text-ink" />
          </label>
          <label className="text-xs text-dim">
            Início
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-line bg-panel2 px-3 text-sm text-ink" />
          </label>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-dim">Rascunhos da marca ({daMarca.length})</div>
          {daMarca.length === 0 ? (
            <p className="text-xs text-faint">Nenhum rascunho com mídia nesta marca.</p>
          ) : (
            <ul className="space-y-2">
              {daMarca.map((r) => (
                <li key={r.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-line bg-panel px-3 py-2 text-sm">
                    <input type="checkbox" checked={escolhidos.includes(r.id)} onChange={() => alternar(r.id)} className="accent-ink" />
                    <span className="min-w-0 truncate text-dim">{r.legenda?.trim() || "post sem legenda"}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-medium text-dim">Datas ({escolhidos.length})</div>
        {escolhidos.length === 0 ? (
          <p className="text-xs text-faint">Escolha os posts à esquerda para ver as datas.</p>
        ) : (
          <ol className="space-y-2">
            {escolhidos.map((id, i) => {
              const post = daMarca.find((r) => r.id === id);
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-panel p-3 text-sm">
                  <span className="w-6 text-faint">{i + 1}</span>
                  <input
                    type="datetime-local"
                    value={dataDe(id)}
                    onChange={(e) => setDatas((d) => ({ ...d, [id]: e.target.value }))}
                    className="min-h-11 rounded-md border border-line bg-panel2 px-2 text-xs text-ink"
                  />
                  <span className="min-w-0 flex-1 truncate text-dim">{post?.legenda?.trim() || "post sem legenda"}</span>
                </li>
              );
            })}
          </ol>
        )}
        {msg && <p className={`text-xs ${msg.ok ? "text-ok" : "text-bad"}`}>{msg.text}</p>}
        <button type="button" onClick={confirmar} disabled={pending || escolhidos.length === 0} className="min-h-11 rounded-md bg-ink px-4 text-sm font-medium text-canvas disabled:opacity-40">
          {pending ? "agendando…" : `Agendar ${escolhidos.length} post(s)`}
        </button>
      </div>
    </div>
  );
}
