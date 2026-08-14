import Link from "next/link";
import { listPersonas, type Persona } from "@/server/personas";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const PAPEL: Record<string, { label: string; dot: string }> = {
  gestor: { label: "Gestor", dot: "#fbbf24" },
  analista: { label: "Analista", dot: "#60a5fa" },
};

function Node({ p }: { p: Persona }) {
  return (
    <Link
      href={`/time/${p.id}`}
      className="flex w-44 flex-col items-center gap-2 rounded-lg border border-line bg-panel p-4 text-center transition-colors hover:border-line2"
    >
      {p.foto_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.foto_url} alt="" className="h-16 w-16 rounded-full border border-line object-cover" />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-full bg-panel2 text-lg font-semibold text-dim">
          {(p.nome[0] ?? "?").toUpperCase()}
        </span>
      )}
      <div>
        <div className="text-sm font-medium text-ink">
          {p.nome}
          {!p.ativo && <span className="ml-1 text-[10px] text-faint">(inativo)</span>}
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-dim">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PAPEL[p.papel]?.dot }} />
          {PAPEL[p.papel]?.label ?? p.papel}
        </div>
        {p.modelo && (
          <div className="mt-1.5 inline-block rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">
            {p.modelo}
          </div>
        )}
        {p.skills && <p className="mt-1 line-clamp-1 text-[10px] text-faint">{p.skills}</p>}
      </div>
    </Link>
  );
}

export default async function TimePage() {
  const personas = await listPersonas();
  const gestores = personas.filter((p) => p.papel === "gestor");
  const analistas = personas.filter((p) => p.papel === "analista");

  return (
    <>
      <PageHeader
        title="Time"
        subtitle="Seu time de mídias sociais: os analistas sugerem, o gestor decide. Clique numa pessoa pra editar (foto, persona, modelo, skills)."
      />

      {/* Organograma */}
      <div className="flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-4">
          {gestores.length ? gestores.map((p) => <Node key={p.id} p={p} />) : <span className="text-sm text-faint">nenhum gestor cadastrado</span>}
        </div>

        {gestores.length > 0 && analistas.length > 0 && <div className="h-10 w-px bg-line2" />}

        {analistas.length > 0 && (
          <div className="w-full border-t border-line2 pt-10">
            <p className="mb-4 text-center text-xs text-faint">os analistas se reportam ao gestor</p>
            <div className="flex flex-wrap justify-center gap-4">
              {analistas.map((p) => (
                <Node key={p.id} p={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
