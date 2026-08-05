// Testa conectividade + SSL no Postgres externo do Supabase. Le a senha do vault (nao hardcoda).
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const vault = join(homedir(), ".claude/credentials/services.env");
const line = readFileSync(vault, "utf8").split("\n").find((l) => l.startsWith("SUPABASE_DB_PASSWORD="));
const pw = line.split("=")[1].trim();

for (const ssl of [false, "prefer", { rejectUnauthorized: false }]) {
  try {
    const sql = postgres({ host: "supabase.toolpad.cloud", port: 5432, database: "postgres", username: "postgres", password: pw, ssl, max: 1, connect_timeout: 12 });
    const [{ v }] = await sql`select 1 as v`;
    console.log("OK  ssl=", JSON.stringify(ssl), " select1=", v);
    await sql.end();
    process.exit(0);
  } catch (e) {
    console.log("FALHOU ssl=", JSON.stringify(ssl), "->", String(e.message).slice(0, 90));
  }
}
process.exit(1);
