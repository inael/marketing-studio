// Cria a tabela personas (time de midias sociais) e semeia 3 analistas + 1 gestor.
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

const PERSONAS = [
  { nome: "Bruno Nogueira", papel: "analista", tracos: "homem, sério, pesquisador, data-driven; foca em notícias e tendências do setor", instrucoes: "Você é analista de mídias sociais sério e pesquisador. Prioriza ângulos baseados em dados, notícias e tendências reais. Tom informativo e confiável, sem sensacionalismo." },
  { nome: "Carla Menezes", papel: "analista", tracos: "mulher, extrovertida, criativa; foca em engajamento e formatos que viralizam", instrucoes: "Você é analista de mídias sociais extrovertida e criativa. Prioriza ganchos fortes, humor leve e formatos de alto engajamento (reels, carrosséis). Tom próximo e animado." },
  { nome: "Diego Prado", papel: "analista", tracos: "homem, estrategista, orientado a negócio; foca em conversão e CTA", instrucoes: "Você é analista de mídias sociais estrategista, focado em conversão. Conecta cada ideia a um objetivo de negócio e termina com CTA claro. Tom objetivo e persuasivo." },
  { nome: "Marina Alves", papel: "gestor", tracos: "mulher, gestora de mídias sociais, crítica construtiva; decide e orienta o time", instrucoes: "Você é a gestora de mídias sociais. Revisa as sugestões dos analistas, escolhe as melhores para a marca, ajusta o que precisar e dá feedback objetivo pro time melhorar, pensando em consistência de marca, calendário e resultado." },
];

const sql = postgres(vault("MARKETING_STUDIO_DATABASE_URL"), { ssl: false });
try {
  await sql`create table if not exists personas (
    id uuid primary key default gen_random_uuid(),
    nome text unique not null,
    papel text not null check (papel in ('analista','gestor')),
    tracos text default '',
    instrucoes text default '',
    ativo boolean default true,
    created_at timestamptz default now()
  )`;
  for (const p of PERSONAS) {
    await sql`insert into personas (nome, papel, tracos, instrucoes)
      values (${p.nome}, ${p.papel}, ${p.tracos}, ${p.instrucoes})
      on conflict (nome) do nothing`;
  }
  const rows = await sql`select nome, papel from personas order by papel, nome`;
  console.log("personas:", rows.map((r) => `${r.nome}(${r.papel})`).join(", "));
} finally {
  await sql.end();
}
