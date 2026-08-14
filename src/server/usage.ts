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
};

/** Registra um evento de consumo. Best-effort: nunca quebra a request. */
export async function logUsage(u: UsageRow): Promise<void> {
  try {
    await sql`insert into usage_events
      (persona, tipo, model, brand_id, prompt_tokens, completion_tokens, total_tokens, credits)
      values (${u.persona ?? null}, ${u.tipo}, ${u.model ?? null}, ${u.brand_id ?? null},
              ${u.prompt_tokens ?? 0}, ${u.completion_tokens ?? 0}, ${u.total_tokens ?? 0}, ${u.credits ?? 0})`;
  } catch {
    /* logar consumo nunca pode derrubar a operação */
  }
}

/** Extrai usage do retorno OpenAI-compatível. */
export function usageFrom(data: unknown): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (data as any)?.usage ?? {};
  return {
    prompt_tokens: u.prompt_tokens ?? 0,
    completion_tokens: u.completion_tokens ?? 0,
    total_tokens: u.total_tokens ?? (u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0),
  };
}

export type UsageReport = {
  days: number;
  totals: { tokens: number; prompt: number; completion: number; credits: number; imagens: number; eventos: number };
  byTipo: { tipo: string; n: number; tokens: number; credits: number }[];
  byPersona: {
    persona: string;
    n: number;
    tokens: number;
    credits: number;
    sugestoes: number;
    legendas: number;
    gestao: number;
    imagens: number;
  }[];
};

export async function usageReport(days = 30): Promise<UsageReport> {
  const [totals] = await sql<UsageReport["totals"][]>`
    select
      coalesce(sum(total_tokens),0)::int as tokens,
      coalesce(sum(prompt_tokens),0)::int as prompt,
      coalesce(sum(completion_tokens),0)::int as completion,
      coalesce(sum(credits),0)::float as credits,
      count(*) filter (where tipo='imagem')::int as imagens,
      count(*)::int as eventos
    from usage_events where created_at >= now() - make_interval(days => ${days})`;
  const byTipo = await sql<UsageReport["byTipo"]>`
    select tipo, count(*)::int as n, coalesce(sum(total_tokens),0)::int as tokens, coalesce(sum(credits),0)::float as credits
    from usage_events where created_at >= now() - make_interval(days => ${days})
    group by tipo order by tokens desc`;
  const byPersona = await sql<UsageReport["byPersona"]>`
    select
      coalesce(persona,'(manual)') as persona,
      count(*)::int as n,
      coalesce(sum(total_tokens),0)::int as tokens,
      coalesce(sum(credits),0)::float as credits,
      count(*) filter (where tipo='sugestao')::int as sugestoes,
      count(*) filter (where tipo='legenda')::int as legendas,
      count(*) filter (where tipo='gestao')::int as gestao,
      count(*) filter (where tipo='imagem')::int as imagens
    from usage_events where created_at >= now() - make_interval(days => ${days})
    group by 1 order by tokens desc`;
  return { days, totals, byTipo, byPersona };
}
