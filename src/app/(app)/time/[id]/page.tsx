import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersona } from "@/server/personas";
import { savePersona } from "../actions";
import { PageHeader, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";

export const dynamic = "force-dynamic";

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

      <form action={action} className="max-w-2xl space-y-5">
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
    </>
  );
}
