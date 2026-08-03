import postgres from "postgres";

// singleton server-only
declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}
export const sql = globalThis.__sql ?? postgres(process.env.DATABASE_URL!, { max: 5 });
if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
