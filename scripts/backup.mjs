// B41: backup do banco. Gera um dump (pg_dump) e, se o R2 estiver configurado, envia para backups/.
// Uso: node scripts/backup.mjs   (precisa de DATABASE_URL e do pg_dump instalado)
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida: nada a fazer.");
  process.exit(1);
}
const pasta = join(process.cwd(), "backups");
mkdirSync(pasta, { recursive: true });
const nome = `marketing-studio-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
const arquivo = join(pasta, nome);
execFileSync("pg_dump", ["--no-owner", "--no-privileges", "-f", arquivo, url], { stdio: "inherit" });
console.log(`dump gerado: ${arquivo} (${statSync(arquivo).size} bytes)`);

if (process.env.R2_BUCKET && process.env.R2_ENDPOINT) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: `backups/${nome}`, Body: readFileSync(arquivo), ContentType: "application/sql" }));
  console.log(`enviado ao R2: backups/${nome}`);
}
