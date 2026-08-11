import { sql } from "./db";

export type Timeslot = {
  id: string;
  brand_id: string;
  weekday: number; // 0=Dom .. 6=Sáb
  hour: number;
  minute: number;
};

export async function listTimeslots(brandId: string): Promise<Timeslot[]> {
  return sql<Timeslot[]>`
    select * from brand_timeslots where brand_id = ${brandId}
    order by weekday, hour, minute`;
}

export async function addTimeslot(
  brandId: string,
  weekday: number,
  hour: number,
  minute: number
): Promise<void> {
  await sql`insert into brand_timeslots (brand_id, weekday, hour, minute)
    values (${brandId}, ${weekday}, ${hour}, ${minute})
    on conflict (brand_id, weekday, hour, minute) do nothing`;
}

export async function removeTimeslot(id: string): Promise<void> {
  await sql`delete from brand_timeslots where id = ${id}`;
}

function slotKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

/**
 * Próximo horário livre da marca a partir de agora, respeitando os timeslots
 * e evitando colidir com posts já agendados. Procura nos próximos 60 dias.
 */
export async function nextOpenSlot(brandId: string): Promise<Date | null> {
  const slots = await listTimeslots(brandId);
  if (slots.length === 0) return null;

  const rows = await sql<{ scheduled_at: string }[]>`
    select scheduled_at from posts
    where brand_id = ${brandId} and scheduled_at is not null
      and status in ('draft', 'scheduled', 'approved')`;
  const taken = new Set(rows.map((r) => slotKey(new Date(r.scheduled_at))));

  const now = new Date();
  for (let d = 0; d < 60; d++) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const wd = base.getDay();
    const daySlots = slots
      .filter((s) => s.weekday === wd)
      .sort((a, b) => a.hour - b.hour || a.minute - b.minute);
    for (const s of daySlots) {
      const cand = new Date(base.getFullYear(), base.getMonth(), base.getDate(), s.hour, s.minute);
      if (cand <= now) continue;
      if (!taken.has(slotKey(cand))) return cand;
    }
  }
  return null;
}
