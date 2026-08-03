import postgres from "postgres";
import { readFileSync } from "node:fs";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
for (const f of ["db/migrations/0001_init.sql", "db/seed_itbooster.sql"]) {
  console.log("applying", f);
  await sql.unsafe(readFileSync(f, "utf8"));
}
await sql.end();
console.log("ok");
