"use client";

import { useState } from "react";

// D33: pergunta sobre os numeros do relatorio; a resposta cita os valores da propria janela.
export type LinhaDados = {
  nome: string;
  self: boolean;
  engajamento: number;
  posts: number;
  media: number;
  seguidores: number;
};

const SUGESTOES = [
  "Quem tem mais engajamento?",
  "Quantos posts eu fiz?",
  "Qual o melhor dia e horário?",
  "Como estou em seguidores?",
];

function responder(pergunta: string, linhas: LinhaDados[], padrao: string): string {
  const q = pergunta.toLowerCase();
  const eu = linhas.find((l) => l.self);
  const outros = linhas.filter((l) => !l.self);
  if (linhas.length === 0) return "Ainda não há dados desta marca no período.";

  if (/engaj|intera|curtid/.test(q)) {
    const ord = [...linhas].sort((a, b) => b.engajamento - a.engajamento);
    const top = ord[0];
    const pos = eu ? ord.findIndex((l) => l.self) + 1 : null;
    const base = `${top.self ? "Você" : "@" + top.nome} lidera em engajamento, com ${top.engajamento.toFixed(2)}%.`;
    return eu && pos ? `${base} Você está em ${pos}º de ${ord.length} (${eu.engajamento.toFixed(2)}%).` : base;
  }
  if (/posts?|publica|quantos|volume|frequ/.test(q)) {
    if (!eu) return "Não encontrei os seus posts no período.";
    const media = outros.length ? outros.reduce((t, l) => t + l.posts, 0) / outros.length : 0;
    return `Você publicou ${eu.posts} posts no período. A média dos concorrentes é ${media.toFixed(1).replace(".", ",")} posts.`;
  }
  if (/hor[aá]rio|hora|dia|quando/.test(q)) {
    return padrao || "Ainda não há horários suficientes para identificar um padrão.";
  }
  if (/segu|audi|crescimento/.test(q)) {
    if (!eu) return "Não encontrei o seu perfil no período.";
    const maior = [...outros].sort((a, b) => b.seguidores - a.seguidores)[0];
    return maior
      ? `Você tem ${eu.seguidores.toLocaleString("pt-BR")} seguidores. O maior concorrente, @${maior.nome}, tem ${maior.seguidores.toLocaleString("pt-BR")}.`
      : `Você tem ${eu.seguidores.toLocaleString("pt-BR")} seguidores.`;
  }
  // resposta geral com o resumo
  const top = [...linhas].sort((a, b) => b.engajamento - a.engajamento)[0];
  return `Não entendi a pergunta com precisão. Resumo: ${top.self ? "você" : "@" + top.nome} lidera em engajamento (${top.engajamento.toFixed(2)}%). Pergunte sobre engajamento, posts, horários ou seguidores.`;
}

export function AskData({ linhas, padrao }: { linhas: LinhaDados[]; padrao: string }) {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<{ q: string; a: string } | null>(null);

  const perguntar = (q: string) => {
    const t = q.trim();
    if (!t) return;
    setResposta({ q: t, a: responder(t, linhas, padrao) });
    setPergunta("");
  };

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <h3 className="text-sm font-medium text-ink">Pergunte aos dados</h3>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          perguntar(pergunta);
        }}
      >
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="ex: quem tem mais engajamento?"
          className="min-w-0 flex-1 rounded-md border border-line bg-panel2 px-3 py-1.5 text-sm text-ink placeholder:text-faint"
        />
        <button type="submit" className="rounded-md border border-line px-3 py-1.5 text-xs text-dim hover:text-ink">
          Perguntar
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGESTOES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => perguntar(s)}
            className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-dim hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
      {resposta && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs text-faint">{resposta.q}</p>
          <p className="mt-1 text-sm text-ink">{resposta.a}</p>
          {/* D33: base da resposta e confianca pelo tamanho da amostra */}
          <p className="mt-2 text-[11px] text-faint">Base: {linhas.reduce((t, l) => t + l.posts, 0)} posts no período · {linhas.reduce((t, l) => t + l.posts, 0) < 5 ? "amostra pequena: confiança baixa" : "amostra suficiente"}</p>
          <button type="button" onClick={() => perguntar(SUGESTOES[(SUGESTOES.indexOf(resposta.q) + 1) % SUGESTOES.length] ?? SUGESTOES[0])} className="mt-3 text-xs text-info hover:underline">
            Próxima pergunta sugerida →
          </button>
        </div>
      )}
    </section>
  );
}
