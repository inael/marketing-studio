"use client";

import { useEffect, useState } from "react";

// D47 + M31: aba Aparencia. Tema (claro, escuro, sistema), densidade, tamanho do texto e contraste
// reforcado mudam o app inteiro na hora (atributos no <html>) e a previa mostra o efeito.
// A escolha fica no navegador.
type Tema = "claro" | "escuro" | "sistema";
type Densidade = "confortavel" | "compacta";
type Texto = "normal" | "grande" | "muito";
type Pref = { tema: Tema; densidade: Densidade; texto: Texto; contraste: boolean };

const CHAVE = "ms_aparencia";
const PADRAO: Pref = { tema: "claro", densidade: "confortavel", texto: "normal", contraste: false };

function ler(): Pref {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Pref>;
      return {
        tema: v.tema === "escuro" || v.tema === "sistema" ? v.tema : "claro",
        densidade: v.densidade === "compacta" ? "compacta" : "confortavel",
        texto: v.texto === "grande" || v.texto === "muito" ? v.texto : "normal",
        contraste: Boolean(v.contraste),
      };
    }
  } catch {
    // localStorage bloqueado: segue com o padrao
  }
  return PADRAO;
}

function escuroDoSistema() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function aplicar(p: Pref) {
  const html = document.documentElement;
  const escuro = p.tema === "escuro" || (p.tema === "sistema" && escuroDoSistema());
  html.dataset.theme = escuro ? "dark" : "light";
  html.dataset.densidade = p.densidade;
  html.dataset.texto = p.texto;
  html.dataset.contraste = p.contraste ? "alto" : "normal";
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    // sem persistencia: vale so nesta sessao
  }
}

export function Aparencia() {
  const [p, setP] = useState<Pref>(PADRAO);

  useEffect(() => {
    setP(ler());
  }, []);

  const mudar = (parte: Partial<Pref>) => {
    const novo = { ...p, ...parte };
    setP(novo);
    aplicar(novo);
  };

  const escuro = p.tema === "escuro" || (p.tema === "sistema" && escuroDoSistema());
  const pad = p.densidade === "compacta" ? "p-2.5" : "p-5";
  const textoPrev = p.texto === "muito" ? "text-base" : p.texto === "grande" ? "text-sm" : "text-xs";

  const opt = (on: boolean) =>
    `min-h-11 rounded-md border px-3 py-1.5 text-xs transition-colors md:min-h-0 ${on ? "border-line2 bg-panel2 text-ink" : "border-line text-dim hover:text-ink"}`;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <div className="mb-2 text-xs font-medium text-dim">Tema</div>
          <div className="flex flex-wrap gap-2">
            {(["claro", "escuro", "sistema"] as Tema[]).map((t) => (
              <button key={t} type="button" className={opt(p.tema === t)} onClick={() => mudar({ tema: t })}>
                {t === "claro" ? "Claro" : t === "escuro" ? "Escuro" : "Do sistema"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-dim">Densidade</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={opt(p.densidade === "confortavel")} onClick={() => mudar({ densidade: "confortavel" })}>
              Confortável
            </button>
            <button type="button" className={opt(p.densidade === "compacta")} onClick={() => mudar({ densidade: "compacta" })}>
              Compacta
            </button>
          </div>
          <p className="mt-2 text-[11px] text-faint">A densidade compacta reduz o tamanho base do texto e os espaçamentos.</p>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-dim">Tamanho do texto</div>
          <div className="flex flex-wrap gap-2">
            {(["normal", "grande", "muito"] as Texto[]).map((t) => (
              <button key={t} type="button" className={opt(p.texto === t)} onClick={() => mudar({ texto: t })}>
                {t === "normal" ? "Normal" : t === "grande" ? "Grande" : "Muito grande"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-dim">Contraste</div>
          <button type="button" className={opt(p.contraste)} onClick={() => mudar({ contraste: !p.contraste })} aria-pressed={p.contraste}>
            Contraste reforçado {p.contraste ? "· ligado" : "· desligado"}
          </button>
        </div>
      </div>

      {/* previa ao vivo, com as cores e o tamanho escolhidos */}
      <div>
        <div className="mb-2 text-xs font-medium text-dim">Prévia</div>
        <div
          className={`rounded-lg border ${pad}`}
          style={{
            background: escuro ? "#141416" : "#f7f7f8",
            borderColor: p.contraste ? (escuro ? "#a1a1aa" : "#17171a") : escuro ? "#26262a" : "#e3e3e8",
            color: escuro ? "#f4f4f5" : "#17171a",
          }}
        >
          <div className={`flex flex-col ${p.densidade === "compacta" ? "gap-1.5" : "gap-3"}`}>
            <div className={`${textoPrev} font-semibold`}>Campanha de outono</div>
            <p className={textoPrev} style={{ color: p.contraste ? (escuro ? "#f4f4f5" : "#000") : escuro ? "#a1a1aa" : "#52525b" }}>
              Três posts agendados para esta semana, com legenda e imagem prontas para aprovar.
            </p>
            <div className="flex gap-2">
              <span className={`rounded-md px-2.5 py-1 font-medium ${textoPrev}`} style={{ background: escuro ? "#f4f4f5" : "#17171a", color: escuro ? "#17171a" : "#ffffff" }}>
                Aprovar
              </span>
              <span className={`rounded-md border px-2.5 py-1 ${textoPrev}`} style={{ borderColor: escuro ? "#34343a" : "#d2d2d9" }}>
                Editar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
