"use client";

import { useMemo, useState } from "react";
import { inputCls, labelCls } from "@/components/ui";

// D23: campos de identidade da marca com previa ao vivo e checagem de contraste.
// Os campos mantem os mesmos "name" do formulario, entao o envio continua igual.
type Inicial = { nome: string; cor_principal: string; fonte: string; site_url: string; tom_voz: string };

// luminancia relativa (WCAG) e razao de contraste contra texto branco
function lum(hex: string): number {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function contraste(hex: string): number {
  const l = lum(hex);
  return (1.05) / (l + 0.05);
}

export function BrandIdentity({ initial, slug }: { initial: Inicial; slug: string }) {
  const [v, setV] = useState<Inicial>(initial);
  const set = (k: keyof Inicial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const alterado = (Object.keys(initial) as (keyof Inicial)[]).some((k) => v[k] !== initial[k]);
  const ratio = useMemo(() => contraste(v.cor_principal), [v.cor_principal]);
  const abaixo = ratio < 4.5;

  // tres posts de exemplo da propria marca, com o tom escrito
  const exemplos = [
    `${v.nome}: sua nota fiscal sai sozinha depois do pagamento.`,
    `Cobrança clara e sem surpresa. Veja como funciona.`,
    `Dica rápida da ${v.nome} para organizar o mês.`,
  ];

  // D23: campos a esquerda e previa ao vivo a direita
  return (
    <div className="grid gap-6 lg:grid-cols-2">
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={alterado ? "text-warn" : "text-faint"}>{alterado ? "Alterações não salvas" : "Sem alterações"}</span>
        {alterado && (
          <button type="button" onClick={() => setV(initial)} className="text-dim hover:text-ink">
            Descartar
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="nome">Nome</label>
          <input id="nome" name="nome" value={v.nome} onChange={set("nome")} className={inputCls} required />
        </div>

        <div>
          <label className={labelCls} htmlFor="cor_principal">Cor da marca</label>
          <div className="flex items-center gap-3">
            <input
              id="cor_principal"
              name="cor_principal"
              type="color"
              value={v.cor_principal}
              onChange={set("cor_principal")}
              className="h-9 w-14 cursor-pointer rounded-md border border-line bg-panel2"
            />
            <span className="font-mono text-sm text-dim">{v.cor_principal}</span>
          </div>
          <p className={`mt-2 text-[11px] ${abaixo ? "text-warn" : "text-faint"}`}>
            Contraste com texto branco: {ratio.toFixed(1).replace(".", ",")}:1. Recomendado: 4,5:1.
            {abaixo && " Texto sobre essa cor pode ficar difícil de ler."}
          </p>
        </div>

        <div>
          <label className={labelCls} htmlFor="fonte">Fonte</label>
          <input id="fonte" name="fonte" value={v.fonte} onChange={set("fonte")} className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="site_url">Site</label>
          <input id="site_url" name="site_url" value={v.site_url} onChange={set("site_url")} className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="tom_voz">
            Tom de voz <span className="text-faint">(guia a IA ao escrever a legenda)</span>
          </label>
          <textarea id="tom_voz" name="tom_voz" value={v.tom_voz} onChange={set("tom_voz")} rows={3} className={inputCls} />
        </div>
      </div>

    </div>
    <div className="space-y-6">
      {/* previa ao vivo: posts de exemplo da marca */}
      <section className="space-y-3">
        <div className="text-[11px] uppercase tracking-wide text-faint">Prévia · posts de exemplo</div>
        <ul className="space-y-2">
          {exemplos.map((t, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-line bg-panel p-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                style={{ background: v.cor_principal }}
              >
                {v.nome.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 text-sm">
                <div className="text-xs text-faint">{slug}</div>
                <p className="text-ink" style={{ fontFamily: v.fonte || undefined }}>{t}</p>
                <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] text-white" style={{ background: v.cor_principal }}>
                  {v.nome}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-faint">Tom: {v.tom_voz ? v.tom_voz.slice(0, 90) : "sem tom definido"}</p>
      </section>
    </div>
    </div>
  );
}
