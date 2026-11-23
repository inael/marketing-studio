// B09: horario local da marca -> UTC. A biblioteca de fusos (Intl) cuida do horario de verao.
export function partesNoFuso(ms: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const o = Object.fromEntries(f.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return { y: Number(o.year), mo: Number(o.month), d: Number(o.day), h: Number(o.hour), mi: Number(o.minute) };
}

// deslocamento do fuso em minutos naquele instante (ex.: -180 para Sao Paulo)
function deslocamento(ms: number, tz: string): number {
  const p = partesNoFuso(ms, tz);
  const comoUtc = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi);
  return Math.round((comoUtc - Math.floor(ms / 60000) * 60000) / 60000);
}

const p2 = (n: number) => String(n).padStart(2, "0");

export type Conversao = { ok: true; iso: string } | { ok: false; motivo: string; sugestao?: string };

/** "YYYY-MM-DDTHH:MM" no fuso da marca -> ISO em UTC. Recusa horario inexistente (troca de verao). */
export function localParaUtc(local: string, tz: string): Conversao {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return { ok: false, motivo: "data ou hora inválida" };
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const alvo = Date.UTC(y, mo - 1, d, h, mi);
  let utc = alvo - deslocamento(alvo, tz) * 60000;
  const off2 = deslocamento(utc, tz);
  if (off2 !== deslocamento(alvo, tz)) utc = alvo - off2 * 60000;
  const volta = partesNoFuso(utc, tz);
  if (volta.h !== h || volta.mi !== mi || volta.d !== d) {
    return {
      ok: false,
      motivo: "esse horário não existe nesse dia (troca de horário de verão)",
      sugestao: `${p2(volta.h)}:${p2(volta.mi)}`,
    };
  }
  return { ok: true, iso: new Date(utc).toISOString() };
}
