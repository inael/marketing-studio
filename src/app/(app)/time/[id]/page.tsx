import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersona, type Persona } from "@/server/personas";
import { savePersona } from "../actions";
import { PersonaFoto } from "@/components/persona-foto";
import { PageHeader, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

export const dynamic = "force-dynamic";

// D37: exemplos montados a partir dos tracos (o tom muda com as palavras-chave)
function exemplos(p: Persona): string[] {
  const t = p.tracos.toLowerCase();
  const tom = /sério|serio|direto/.test(t) ? "Sem rodeios: " : /extrovert|anima|alegr/.test(t) ? "Bora! " : "Olá! ";
  return [
    `${tom}${p.nome} aqui. Veja como a sua conta pode ganhar tempo esta semana.`,
    `${tom}Uma dica rápida para organizar o mês, em três passos.`,
  ];
}

export default async function EditPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPersona(id);
  if (!p) notFound();

  const action = savePersona.bind(null, p.id);

  return (
    <>
      <PageHeader
        title={p.nome}
        subtitle={p.papel === "gestor" ? "Gestor" : "Analista"}
        action={
          <Link href="/time" className={btnGhost}>
            Voltar
          </Link>
        }
      />

      <div className="mb-6 max-w-2xl">
        <label className={labelCls}>Foto do {p.papel === "gestor" ? "gestor" : "analista"}</label>
        <PersonaFoto id={p.id} foto={p.foto_url} nome={p.nome} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
      <form action={action} className="space-y-5">
        <div>
          <label className={labelCls} htmlFor="nome">
            Nome
          </label>
          <input id="nome" name="nome" defaultValue={p.nome} className={inputCls} required />
        </div>

        <div>
          <label className={labelCls} htmlFor="tracos">
            Traços da persona{" "}
            <span className="text-faint">(homem/mulher, sério/extrovertido, pesquisador…)</span>
          </label>
          <textarea id="tracos" name="tracos" defaultValue={p.tracos} rows={2} className={inputCls} />
        </div>

        <div>
          <label className={labelCls} htmlFor="instrucoes">
            Instruções <span className="text-faint">(como esse agente pensa ao trabalhar)</span>
          </label>
          <textarea
            id="instrucoes"
            name="instrucoes"
            defaultValue={p.instrucoes}
            rows={5}
            className={inputCls}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="modelo">
              Modelo de IA <span className="text-faint">(o &ldquo;cérebro&rdquo; desse agente)</span>
            </label>
            <input
              id="modelo"
              name="modelo"
              defaultValue={p.modelo}
              placeholder="gpt-4o, claude-sonnet-46, gemini-pro, deepseek-v3…"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="skills">
              Skills <span className="text-faint">(especialidades)</span>
            </label>
            <input
              id="skills"
              name="skills"
              defaultValue={p.skills}
              placeholder="copywriting, pesquisa de tendências, conversão…"
              className={inputCls}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm text-dim">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={p.ativo}
            className="h-4 w-4 rounded border-line bg-panel2 accent-ok"
          />
          Ativo (participa do time)
        </label>

        <div className="flex gap-3 border-t border-line pt-5">
          <button type="submit" className={btnPrimary}>
            Salvar
          </button>
          <Link href="/time" className={btnGhost}>
            Cancelar
          </Link>
        </div>
      </form>
      {/* D37: exemplos e instrucoes lado a lado com o formulario */}
      <aside className="space-y-4">
        {/* M24: tom em chips curtos, para ler a voz num relance */}
        <div className="flex flex-wrap gap-1.5">
          {p.tracos.split(/[,;]/).map((t) => t.trim()).filter(Boolean).slice(0, 8).map((t) => (
            <span key={t} className="rounded-full border border-line px-2.5 py-1 text-xs text-dim">{t}</span>
          ))}
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <h3 className="text-sm font-medium text-ink">Exemplos gerados</h3>
          <p className="mt-0.5 text-[11px] text-faint">Montados a partir dos traços. Mude os traços e veja o efeito.</p>
          <ul className="mt-3 space-y-2">
            {exemplos(p).map((t, i) => (
              <li key={i} className="rounded-md bg-panel2 p-3 text-sm text-ink">{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-panel p-4">
          <h3 className="text-sm font-medium text-ink">Instruções ativas</h3>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-dim">
            {(p.instrucoes || "sem instruções").split("\n").filter(Boolean).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        </div>
      </aside>
      </div>
    </>
  );
}
