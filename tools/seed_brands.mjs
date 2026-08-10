// Semeia as 7 marcas alem da itbooster (idempotente). Le a URL do vault.
import postgres from "postgres";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function vault(key) {
  const f = path.join(os.homedir(), ".claude", "credentials", "services.env");
  for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
    if (l.startsWith(key + "=")) return l.slice(key.length + 1).trim();
  }
  throw new Error(key + " nao encontrado no vault");
}

const BRANDS = [
  { slug: "freelancego", nome: "FreelanceGo", cor: "#2563eb", site: "https://freelancego.com.br", tom: "pratico e direto, pra quem vende servico freelance e quer previsibilidade" },
  { slug: "darkemail", nome: "Darkemail", cor: "#e11d48", site: "https://darkemail.school", tom: "privacidade sem friccao, tom techie e agil" },
  { slug: "jetsend", nome: "JetSend", cor: "#f97316", site: "https://jetsend.com.br", tom: "e-mail marketing sem complicacao, energico e objetivo" },
  { slug: "simpleszap", nome: "SimplesZap", cor: "#25d366", site: "https://simpleszap.com", tom: "automacao de WhatsApp descomplicada, proximo e pratico" },
  { slug: "usetokia", nome: "UseTokia", cor: "#0ea5e9", site: "https://usetokia.com", tom: "IA acessivel pra negocios, inteligente e direto" },
  { slug: "recapitule", nome: "Recapitule", cor: "#14b8a6", site: "https://recapitule.com.br", tom: "reunioes viram decisoes, produtivo e claro" },
  { slug: "assinaagora", nome: "Assina Agora", cor: "#d97706", site: "https://assinaagora.com.br", tom: "assinatura digital sem burocracia, confiavel e simples" },
];

const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  for (const b of BRANDS) {
    await sql`
      insert into brands (slug, nome, cor_principal, fonte, tom_voz, site_url)
      values (${b.slug}, ${b.nome}, ${b.cor}, 'Inter', ${b.tom}, ${b.site})
      on conflict (slug) do update set
        nome = excluded.nome, cor_principal = excluded.cor_principal,
        tom_voz = excluded.tom_voz, site_url = excluded.site_url`;
  }
  const rows = await sql`select slug, nome, cor_principal from brands order by nome`;
  console.log("brands:", rows.map((r) => `${r.slug}(${r.cor_principal})`).join(", "));
  console.log("total:", rows.length);
} finally {
  await sql.end();
}
