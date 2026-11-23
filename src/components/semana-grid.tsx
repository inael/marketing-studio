"use client";

import { useState, useTransition, type DragEvent } from "react";
import { reagendarPost } from "@/app/(app)/calendario/actions";

// D18: grade semanal com blocos arrastaveis. Soltar um bloco muda o horario do post;
// a hora sob o cursor aparece ao lado dele e blocos no mesmo horario ficam lado a lado.
export type SemanaDia = { iso: string; rotulo: string };
export type SemanaItem = { id: string; dia: string; hora: number; hm: string; nome: string; cor: string; legenda: string };

const PASSO_MIN = 5;
const pad = (n: number) => String(n).padStart(2, "0");

export function SemanaGrid({
  dias,
  horas,
  itens,
}: {
  dias: SemanaDia[];
  horas: number[];
  itens: SemanaItem[];
}) {
  const [pendente, iniciar] = useTransition();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ hora: number; minuto: number; x: number; y: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // D18: escala (grade de horas) ou barra de 24 horas por dia, com um tracinho por post
  const [modo, setModo] = useState<"escala" | "barra">("escala");

  // minuto sob o cursor dentro da celula, arredondado para o passo de 5 min
  const minutoDe = (e: DragEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 0.999);
    return Math.floor((frac * 60) / PASSO_MIN) * PASSO_MIN;
  };

  const soltar = (e: DragEvent<HTMLDivElement>, dia: string, hora: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || arrastando;
    const minuto = minutoDe(e);
    setArrastando(null);
    setCursor(null);
    if (!id) return;
    const [ano, mes, d] = dia.split("-").map(Number);
    const quando = new Date(ano, mes - 1, d, hora, minuto, 0, 0);
    setErro(null);
    iniciar(async () => {
      const r = await reagendarPost(id, quando.toISOString());
      setErro(r.ok ? null : r.error);
    });
  };

  const celula = (dia: string, hora: number) =>
    itens.filter((i) => i.dia === dia && i.hora === hora).sort((a, b) => a.hm.localeCompare(b.hm));

  if (modo === "barra") {
    const minutosDe = (hm: string) => {
      const [h, m] = hm.split(":").map(Number);
      return h * 60 + m;
    };
    return (
      <div className="space-y-3">
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => setModo("escala")} className="min-h-11 rounded-md border border-line px-3 text-dim hover:text-ink">Escala</button>
          <button type="button" aria-pressed="true" className="min-h-11 rounded-md border border-line2 bg-panel2 px-3 text-ink">Barra</button>
        </div>
        {dias.map((d) => {
          const dia = itens.filter((i) => i.dia === d.iso).sort((x, y) => minutosDe(x.hm) - minutosDe(y.hm));
          return (
            <div key={d.iso} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-xs">
              <div className="text-dim">
                {d.rotulo} <span className="text-faint">· {dia.length} post(s)</span>
              </div>
              <div className="relative h-6 rounded bg-panel2">
                {dia.map((it) => (
                  <span
                    key={it.id}
                    title={`${it.hm} · ${it.nome} · ${it.legenda || "sem legenda"}`}
                    className="absolute inset-y-1 w-1 rounded"
                    style={{ left: `${(minutosDe(it.hm) / 1440) * 100}%`, background: it.cor }}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between pl-[7.75rem] text-[10px] text-faint"><span>0h</span><span>12h</span><span>24h</span></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {(pendente || erro) && (
        <p className={`mb-2 text-xs ${erro ? "text-bad" : "text-faint"}`}>{erro ?? "salvando novo horário…"}</p>
      )}
      <div className="mb-3 flex gap-2 text-xs">
        <button type="button" aria-pressed="true" className="min-h-11 rounded-md border border-line2 bg-panel2 px-3 text-ink">Escala</button>
        <button type="button" onClick={() => setModo("barra")} className="min-h-11 rounded-md border border-line px-3 text-dim hover:text-ink">Barra</button>
      </div>

      {/* M12: no celular, a semana vira uma lista por dia, em ordem de horario */}
      <div className="space-y-3 md:hidden">
        {dias.map((d) => {
          const lista = itens.filter((i) => i.dia === d.iso).sort((x, y) => x.hm.localeCompare(y.hm));
          return (
            <section key={d.iso} className="rounded-lg border border-line bg-panel p-3">
              <h3 className="mb-2 text-xs font-medium text-dim">{d.rotulo}</h3>
              {lista.length === 0 ? (
                <p className="text-xs text-faint">Nada agendado.</p>
              ) : (
                <ul className="space-y-2">
                  {lista.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 text-sm">
                      <span className="w-12 shrink-0 font-mono text-xs text-faint">{it.hm}</span>
                      <span className="h-6 w-1 shrink-0 rounded" style={{ background: it.cor }} aria-hidden />
                      <span className="min-w-0 truncate text-ink">{it.nome} · {it.legenda || "sem legenda"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-line md:block">
        <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="border-b border-line bg-panel" />
          {dias.map((d) => (
            <div key={d.iso} className="border-b border-l border-line bg-panel px-2 py-2 text-xs text-dim">
              {d.rotulo}
            </div>
          ))}
          {horas.map((h) => (
            <div key={h} className="contents">
              <div className="border-b border-line px-2 py-1 text-right text-[11px] text-faint">{pad(h)}h</div>
              {dias.map((d) => {
                const lista = celula(d.iso, h);
                return (
                  <div
                    key={d.iso + h}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setCursor({ hora: h, minuto: minutoDe(e), x: e.clientX, y: e.clientY });
                    }}
                    onDrop={(e) => soltar(e, d.iso, h)}
                    className="min-h-12 border-b border-l border-line p-1"
                  >
                    <div className="flex gap-1">
                      {lista.map((it) => (
                        <div
                          key={it.id}
                          draggable
                          onDragStart={(e) => {
                            setArrastando(it.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", it.id);
                          }}
                          onDragEnd={() => {
                            setArrastando(null);
                            setCursor(null);
                          }}
                          title={`${it.nome} · ${it.hm} · ${it.legenda || "(sem legenda)"}`}
                          className={`min-w-0 cursor-grab rounded bg-panel px-1.5 py-1 text-[11px] transition-opacity ${
                            lista.length > 1 ? "flex-1" : "w-full"
                          } ${arrastando === it.id ? "opacity-40" : ""}`}
                          style={{ borderLeft: `3px solid ${it.cor}` }}
                        >
                          <div className="font-mono text-faint">
                            {it.hm} · {it.nome}
                          </div>
                          <div className="truncate text-dim">{it.legenda || "sem legenda"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {cursor && arrastando && (
        <div
          className="pointer-events-none fixed z-50 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-white"
          style={{ left: cursor.x + 14, top: cursor.y + 14 }}
        >
          {pad(cursor.hora)}:{pad(cursor.minuto)}
        </div>
      )}
    </div>
  );
}
