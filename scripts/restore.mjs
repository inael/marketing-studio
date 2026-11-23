// B41: restauração. Só roda com --confirmar, porque sobrescreve o banco.
// Uso: node scripts/restore.mjs caminho/do/arquivo.sql --confirmar
import { execFileSync } from "node:child_process";

const arquivo = process.argv[2];
const url = process.env.DATABASE_URL;
if (!arquivo || !url) {
  console.error("uso: DATABASE_URL=... node scripts/restore.mjs arquivo.sql --confirmar");
  process.exit(1);
}
if (!process.argv.includes("--confirmar")) {
  console.error("Restauração sobrescreve o banco. Rode de novo com --confirmar se tiver certeza.");
  process.exit(1);
}
execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-f", arquivo, url], { stdio: "inherit" });
console.log("restauração concluída");
