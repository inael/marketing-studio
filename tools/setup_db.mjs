// Cria role ms_app + database marketing_studio (owner ms_app) no Postgres do Supabase.
// Le a senha superuser do vault (nao hardcoda) e salva o DATABASE_URL do app no vault (nao imprime a senha).
import postgres from "postgres";
import crypto from "node:crypto";
import { readFileSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const vault = join(homedir(), ".claude/credentials/services.env");
const env = (k) => {
  const l = readFileSync(vault, "utf8").split("\n").find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim() : null;
};

const SUPER_PW = env("SUPABASE_DB_PASSWORD");
const HOST = "supabase.toolpad.cloud", PORT = 5432;
const pw = crypto.randomBytes(18).toString("base64url");

// 1) role + database (conecta no db 'postgres' como superuser)
const admin = postgres({ host: HOST, port: PORT, database: "postgres", username: "postgres", password: SUPER_PW, ssl: false, max: 1 });
await admin.unsafe(
  `DO $$ BEGIN IF EXISTS (SELECT FROM pg_roles WHERE rolname='ms_app') THEN ALTER ROLE ms_app LOGIN PASSWORD '${pw}'; ELSE CREATE ROLE ms_app LOGIN PASSWORD '${pw}'; END IF; END $$;`
);
// no Supabase o 'postgres' nao e superuser pleno; precisa ser membro de ms_app pra defini-lo como OWNER
await admin.unsafe(`GRANT ms_app TO postgres`);
const [{ exists }] = await admin`select exists(select 1 from pg_database where datname='marketing_studio') as exists`;
if (!exists) await admin.unsafe(`CREATE DATABASE marketing_studio OWNER ms_app`);
else await admin.unsafe(`ALTER DATABASE marketing_studio OWNER TO ms_app`);
await admin.end();

// 2) dono do schema public = ms_app (pra poder criar tabelas)
const dbAdmin = postgres({ host: HOST, port: PORT, database: "marketing_studio", username: "postgres", password: SUPER_PW, ssl: false, max: 1 });
await dbAdmin.unsafe(`ALTER SCHEMA public OWNER TO ms_app`);
await dbAdmin.unsafe(`GRANT ALL ON SCHEMA public TO ms_app`);
await dbAdmin.end();

// 3) salva DATABASE_URL no vault
const url = `postgresql://ms_app:${pw}@${HOST}:${PORT}/marketing_studio`;
appendFileSync(vault, `\n# Marketing Studio DB (2026-08-03)\nMARKETING_STUDIO_DATABASE_URL=${url}\n`);
console.log("OK: role ms_app + database marketing_studio prontos. MARKETING_STUDIO_DATABASE_URL salvo no vault (senha nao exibida).");
