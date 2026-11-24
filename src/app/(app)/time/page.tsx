import Link from "next/link";
import { listPersonas, type Persona } from "@/server/personas";
import { listPosts } from "@/server/posts";
import { listAllBrands } from "@/server/brands";
import { PageHeader } from "@/components/ui";

// D49: papeis e acoes permitidas (ordem: analista, gestor, administrador)
const PAPEIS = ["Analista", "Gestor", "Administrador"];
const MATRIZ: [string, boolean, boolean, boolean][] = [
  ["Criar e editar rascunhos", true, true, true],
  ["Agendar em lote", true, true, true],
  ["Aprovar posts", false, true, true],
  ["Publicar agora", false, true, true],
  ["Editar marcas e horários", false, true, true],
  ["Ver e revelar o cofre", false, true, true],
  ["Gerenciar o time", false, false, true],
  ["Configurar IA e integrações", false, false, true],
];

export const dynamic = "force-dynamic";

const PAPEL: Record<string, { label: string; dot: string }> = {
  gestor: { label: "Gestor", dot: "#fbbf24" },
  analista: { label: "Analista", dot: "#60a5fa" },
};

// D36: cada cartao mostra as marcas que a pessoa atende e um resumo do tom
function Node({ p, marcas, carga, postsMes }: { p: Persona; marcas: string[]; carga: number; postsMes: number }) {
  return (
    <Link
      href={`/time/${p.id}`}
      className="flex w-56 flex-col items-center gap-2.5 rounded-xl border border-line bg-panel p-5 text-center transition-colors hover:border-line2"
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
        <p className="mt-1.5 line-clamp-2 text-[10px] text-dim">
          {marcas.length > 0 ? `atende ${marcas.join(", ")}` : "sem marca atribuída"}
        </p>
        {p.tracos && <p className="mt-0.5 line-clamp-2 text-[10px] text-faint">tom: {p.tracos.slice(0, 80)}</p>}
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-faint">
          <span className="h-1 w-12 overflow-hidden rounded bg-panel2"><span className="block h-full bg-info" style={{ width: `${Math.min(carga, 10) * 10}%` }} /></span>
          carga {carga} · {postsMes} post(s) no mês
        </div>
      </div>
    </Link>
  );
}

export default async function TimePage({ searchParams }: { searchParams: Promise<{ marca?: string }> }) {
  const { marca } = await searchParams;
  const [personas, posts, brands] = await Promise.all([listPersonas(), listPosts(), listAllBrands()]);
  // M23: carga da semana: posts agendados nos proximos 7 dias por analista
  const ate = Date.now() + 7 * 86400000;
  const cargaDe = new Map<string, number>();
  for (const p of posts) {
    if (!p.analista || p.deleted_at || !p.scheduled_at) continue;
    const t = new Date(p.scheduled_at).getTime();
    if (t < Date.now() || t > ate) continue;
    cargaDe.set(p.analista, (cargaDe.get(p.analista) ?? 0) + 1);
  }
  // marcas atendidas: as que tem sugestao/post atribuido a pessoa (campo analista)
  const nomeMarca = new Map(brands.map((b) => [b.id, b.nome]));
  const marcasDe = new Map<string, string[]>();
  for (const p of posts) {
    if (!p.analista || p.deleted_at) continue;
    const nome = nomeMarca.get(p.brand_id);
    if (!nome) continue;
    const lista = marcasDe.get(p.analista) ?? [];
    if (!lista.includes(nome)) lista.push(nome);
    marcasDe.set(p.analista, lista);
  }
  // D36: filtro por marca; so as personas que atendem aquela marca
  const marcaSel = marca ? brands.find((b) => b.slug === marca) : undefined;
  const visiveis = (p: Persona) => !marcaSel || (marcasDe.get(p.nome) ?? []).includes(marcaSel.nome);
  const gestores = personas.filter((p) => p.papel === "gestor" && visiveis(p));
  const analistas = personas.filter((p) => p.papel === "analista" && visiveis(p));
  // posts produzidos no mes por persona
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const postsMesDe = new Map<string, number>();
  for (const p of posts) {
    if (!p.analista || p.deleted_at || new Date(p.created_at).getTime() < inicioMes) continue;
    postsMesDe.set(p.analista, (postsMesDe.get(p.analista) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        title="Time"
        subtitle="Seu time de mídias sociais: os analistas sugerem, o gestor decide. Clique numa pessoa pra editar (foto, persona, modelo, skills)."
      />

      {/* D38: fluxo de criacao e revisao, do analista ate a publicacao */}
      <ol className="mb-10 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center" aria-label="Fluxo de criação e revisão">
        {[
          { n: "1", t: "Analista cria", d: "sugestão ou rascunho" },
          { n: "2", t: "Gestor revisa", d: "aprova ou pede ajuste" },
          { n: "3", t: "Vai ao ar", d: "publicação ou agendamento" },
        ].map((e, i, lista) => (
          <li key={e.n} className="contents">
            <span className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warn text-sm font-bold text-canvas">{e.n}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{e.t}</span>
                <span className="block text-xs text-faint">{e.d}</span>
              </span>
            </span>
            {i < lista.length - 1 && <span className="mx-auto hidden text-faint md:block" aria-hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="h-4 w-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>}
          </li>
        ))}
      </ol>

      {/* D36: filtro por marca: so as personas que atendem a marca escolhida */}
      <div className="mb-8">
        <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Filtrar por marca</div>
      <div className="flex flex-wrap justify-center gap-1.5 rounded-xl border border-line bg-panel p-1.5 text-xs">
        <a href="/time" className={`inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm transition-colors ${!marcaSel ? "bg-panel2 text-ink shadow-sm" : "text-dim hover:text-ink"}`}>Todas</a>
        {brands.map((b) => (
          <a key={b.id} href={`/time?marca=${b.slug}`} className={`inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm transition-colors ${marcaSel?.id === b.id ? "bg-panel2 text-ink shadow-sm" : "text-dim hover:text-ink"}`}>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: b.cor_principal }} />
            {b.nome}
          </a>
        ))}
      </div>
      </div>

      {/* D38: clicar numa pessoa leva aos posts dela */}
      <div className="mb-10">
        <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-faint">Posts de cada pessoa</div>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {[...gestores, ...analistas].map((p) => (
          <a key={p.id} href={`/posts?analista=${encodeURIComponent(p.nome)}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-panel px-3.5 text-sm text-dim transition-colors hover:text-ink">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-panel2 text-[11px] font-semibold text-ink">{p.nome.charAt(0)}</span>
            {p.nome}
          </a>
        ))}
      </div>
      </div>

      {/* Organograma */}
      <div className="flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-4">
          {gestores.length ? gestores.map((p) => <Node key={p.id} p={p} marcas={marcasDe.get(p.nome) ?? []} carga={cargaDe.get(p.nome) ?? 0} postsMes={postsMesDe.get(p.nome) ?? 0} />) : <span className="text-sm text-faint">nenhum gestor cadastrado</span>}
        </div>

        {gestores.length > 0 && analistas.length > 0 && <div className="h-10 w-px bg-line2" />}

        {analistas.length > 0 && (
          <div className="w-full border-t border-line2 pt-10">
            <p className="mb-4 text-center text-xs text-faint">os analistas se reportam ao gestor</p>
            <div className="flex flex-wrap justify-center gap-4">
              {analistas.map((p) => (
                <Node key={p.id} p={p} marcas={marcasDe.get(p.nome) ?? []} carga={cargaDe.get(p.nome) ?? 0} postsMes={postsMesDe.get(p.nome) ?? 0} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* D49: tres papeis e a matriz do que cada um pode fazer */}
      <section className="mt-12 w-full">
        <h2 className="mb-1 text-sm font-semibold text-ink">Papéis e permissões</h2>
        <p className="mb-4 text-xs text-faint">Analista sugere e cria; gestor decide e publica; administrador configura o estúdio.</p>
        <div className="overflow-x-auto rounded-lg border border-line bg-panel">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-faint">
                <th className="px-4 py-2 font-medium">Ação</th>
                {PAPEIS.map((p) => (
                  <th key={p} className="px-3 py-2 text-center font-medium">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIZ.map(([acao, ...quem]) => (
                <tr key={acao} className="border-b border-line/60">
                  <td className="px-4 py-2 text-dim">{acao}</td>
                  {quem.map((ok, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <span className={ok ? "text-ok" : "text-faint"} aria-label={ok ? "permitido" : "não permitido"}>{ok ? (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="mx-auto h-4 w-4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4 4 10-10" /></svg>) : (<span aria-hidden className="mx-auto block h-px w-3 bg-line2" />)}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
