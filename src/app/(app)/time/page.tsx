import Link from "next/link";
import { listPersonas } from "@/server/personas";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const PAPEL: Record<string, { label: string; dot: string }> = {
  gestor: { label: "Gestor", dot: "#fbbf24" },
  analista: { label: "Analista", dot: "#60a5fa" },
};

export default async function TimePage() {
  const personas = await listPersonas();
  const gestores = personas.filter((p) => p.papel === "gestor");
  const analistas = personas.filter((p) => p.papel === "analista");

  const card = (p: (typeof personas)[number]) => (
    <Link
      key={p.id}
      href={`/time/${p.id}`}
      className="group relative overflow-hidden rounded-lg border border-line bg-panel p-5 transition-colors hover:border-line2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-ink">{p.nome}</span>
        {!p.ativo && <span className="text-[11px] text-faint">inativo</span>}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: PAPEL[p.papel]?.dot }} />
        <span className="text-dim">{PAPEL[p.papel]?.label ?? p.papel}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-dim">{p.tracos || "sem traços definidos"}</p>
      {p.skills && <p className="mt-1.5 line-clamp-1 text-[11px] text-faint">skills: {p.skills}</p>}
      {p.modelo && <div className="mt-2 inline-block rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-dim">{p.modelo}</div>}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Time"
        subtitle="Seu time de mídias sociais: analistas sugerem, o gestor decide. Edite as personas."
      />

      <div className="space-y-8">
        <section>
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Gestor</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{gestores.map(card)}</div>
        </section>
        <section>
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Analistas</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{analistas.map(card)}</div>
        </section>
      </div>
    </>
  );
}
