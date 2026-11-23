import { sql } from "./db";

export type UsageRow = {
  persona?: string | null;
  tipo: "sugestao" | "legenda" | "gestao" | "insight" | "imagem" | "descricao";
  model?: string | null;
  brand_id?: string | null;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  credits?: number;
  cost?: number;
};

/** Registra um evento de consumo. Best-effort: nunca quebra a request. */
export async function logUsage(u: UsageRow): Promise<void> {
  try {
    await sql`insert into usage_events
      (persona, tipo, model, brand_id, prompt_tokens, completion_tokens, total_tokens, credits, cost)
      values (${u.persona ?? null}, ${u.tipo}, ${u.model ?? null}, ${u.brand_id ?? null},
              ${u.prompt_tokens ?? 0}, ${u.completion_tokens ?? 0}, ${u.total_tokens ?? 0}, ${u.credits ?? 0}, ${u.cost ?? 0})`;
  } catch {
    /* logar consumo nunca pode derrubar a operação */
  }
}

/** Extrai usage (tokens + custo US$) do retorno OpenAI-compatível. */
export function usageFrom(data: unknown): {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (data as any)?.usage ?? {};
  return {
    prompt_tokens: u.prompt_tokens ?? 0,
    completion_tokens: u.completion_tokens ?? 0,
    total_tokens: u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0),
    cost: Number(u.cost ?? 0),
  };
}

export type UsageReport = {
  days: number;
  totals: { tokens: number; prompt: number; completion: number; credits: number; cost: number; imagens: number; eventos: number };
  byTipo: { tipo: string; n: number; tokens: number; credits: number; cost: number }[];
  byPersona: {
    persona: string;
    n: number;
    tokens: number;
    credits: number;
    cost: number;
    sugestoes: number;
    legendas: number;
    gestao: number;
    imagens: number;
  }[];
};

export async function usageReport(days = 30, brandId?: string | null): Promise<UsageReport> {
  const desde = Date.now() - days * 86_400_000;
  const todas = await sql<{ tipo: string; persona: string | null; brand_id: string | null; total_tokens: number; prompt_tokens: number; completion_tokens: number; credits: number; created_at: Date }[]>`
    select tipo, persona, brand_id, total_tokens, prompt_tokens, completion_tokens, credits, created_at from usage_events`;
  const rows = todas.filter((r) => new Date(r.created_at).getTime() >= desde && (!brandId || r.brand_id === brandId));
  const soma = (f: (r: (typeof rows)[number]) => number) => rows.reduce((acc, r) => acc + (Number(f(r)) || 0), 0);
  const totals = {
    tokens: Math.round(soma((r) => r.total_tokens)),
    prompt: Math.round(soma((r) => r.prompt_tokens)),
    completion: Math.round(soma((r) => r.completion_tokens)),
    credits: soma((r) => r.credits),
    cost: 0,
    imagens: rows.filter((r) => r.tipo === "imagem").length,
    eventos: rows.length,
  };
  totals.cost = Number((totals.credits * 0.002).toFixed(4));
  const agrupa = <K extends string>(chave: (r: (typeof rows)[number]) => K) => {
    const m = new Map<K, (typeof rows)>();
    for (const r of rows) m.set(chave(r), [...(m.get(chave(r)) ?? []), r]);
    return m;
  };
  const porTipo = agrupa((r) => r.tipo);
  const byTipo = [...porTipo.entries()]
    .map(([tipo, rs]) => ({
      tipo,
      n: rs.length,
      tokens: rs.reduce((a, r) => a + r.total_tokens, 0),
      credits: rs.reduce((a, r) => a + Number(r.credits), 0),
      cost: rs.reduce((a, r) => a + Number(r.credits), 0) * 0.002,
    }))
    .sort((a, b) => b.tokens - a.tokens);
  const porPersona = agrupa((r) => r.persona ?? "(manual)");
  const byPersona = [...porPersona.entries()]
    .map(([persona, rs]) => ({
      persona,
      n: rs.length,
      tokens: rs.reduce((a, r) => a + r.total_tokens, 0),
      credits: rs.reduce((a, r) => a + Number(r.credits), 0),
      cost: rs.reduce((a, r) => a + Number(r.credits), 0) * 0.002,
      sugestoes: rs.filter((r) => r.tipo === "sugestao").length,
      legendas: rs.filter((r) => r.tipo === "legenda").length,
      gestao: rs.filter((r) => r.tipo === "gestao").length,
      imagens: rs.filter((r) => r.tipo === "imagem").length,
    }))
    .sort((a, b) => b.tokens - a.tokens);
  return { days, totals, byTipo, byPersona };
}
