import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/server/brands";
import { exigirMarca } from "@/server/permissoes";
import {
  ANGULOS,
  MAX_ESTILO,
  MAX_PERSONAGENS,
  MIN_ESTILO_RECOMENDADO,
  listEstilo,
  listPersonagens,
} from "@/server/referencias";
import {
  addEstiloAction,
  removeEstiloAction,
  criarPersonagemForm,
  removePersonagemAction,
  setPersonagemFotoAction,
  removePersonagemFotoAction,
} from "./actions";
import { PageHeader, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/ui";
import { ReferenciaUpload } from "@/components/referencia-upload";

export const dynamic = "force-dynamic";

export default async function ReferenciasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) notFound();
  await exigirMarca(b.id, "ver", "referencias");

  const estilo = await listEstilo(b.id);
  const personagens = await listPersonagens(b.id);

  return (
    <>
      <PageHeader
        title="Referências visuais"
        subtitle={`${b.nome} · imagens que guiam o estilo e a aparência dos personagens`}
        action={
          <Link href={`/marcas/${slug}`} className={btnGhost}>
            Voltar
          </Link>
        }
      />

      {/* ESTILO: 5 a 10 imagens de referencia */}
      <section className="mb-10 max-w-4xl" aria-labelledby="estilo">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="estilo" className="text-sm font-semibold text-ink">Estilo da marca</h2>
          <span className="text-xs text-dim">{estilo.length} de {MAX_ESTILO} imagens (recomendado: {MIN_ESTILO_RECOMENDADO} a {MAX_ESTILO})</span>
        </div>
        <p className="mb-4 text-xs text-dim">Envie imagens que mostrem o estilo visual que as postagens devem seguir: cores, luz, composição e tipo de imagem.</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {estilo.map((e) => (
            <div key={e.id} className="relative overflow-hidden rounded-md border border-line bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.url} alt="" className="aspect-square w-full object-cover" />
              <form action={removeEstiloAction.bind(null, b.id, slug, e.id)} className="absolute right-1 top-1">
                <button type="submit" className="rounded bg-black/60 px-2 py-0.5 text-[11px] text-white" aria-label="Remover imagem de estilo">
                  Remover
                </button>
              </form>
            </div>
          ))}
        </div>

        {estilo.length < MAX_ESTILO && (
          <div className="mt-4">
            <ReferenciaUpload
              rotulo="Enviar imagens de estilo"
              multiplo
              brandId={b.id}
              aoEnviar={addEstiloAction.bind(null, b.id, slug)}
            />
          </div>
        )}
      </section>

      {/* PERSONAGENS: ficha visual de 8 angulos por pessoa */}
      <section className="max-w-4xl" aria-labelledby="personagens">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="personagens" className="text-sm font-semibold text-ink">Personagens</h2>
          <span className="text-xs text-dim">{personagens.length} de {MAX_PERSONAGENS}</span>
        </div>
        <p className="mb-4 text-xs text-dim">
          Cada personagem tem uma ficha visual com 8 fotos: rosto de frente, dois perfis, rosto 3/4 e o corpo de frente, dois laterais e de costas. Use fotos nítidas, fundo neutro e a mesma luz.
        </p>

        {personagens.map((p) => {
          const feitas = ANGULOS.filter((a) => p.fotos[a.id]).length;
          return (
            <div key={p.id} className="mb-6 rounded-lg border border-line bg-panel p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-ink">
                  {p.nome} <span className="text-xs text-dim">· {feitas} de 8 fotos</span>
                </h3>
                <form action={removePersonagemAction.bind(null, b.id, slug, p.id)}>
                  <button type="submit" className={btnGhost}>Remover personagem</button>
                </form>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ANGULOS.map((a) => {
                  const url = p.fotos[a.id];
                  return (
                    <div key={a.id} className="flex flex-col gap-2">
                      <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-panel2">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={a.rotulo} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center p-2 text-center text-[11px] text-faint">{a.rotulo}</span>
                        )}
                      </div>
                      {url ? (
                        <form action={removePersonagemFotoAction.bind(null, b.id, slug, p.id, a.id)}>
                          <button type="submit" className="text-[11px] text-dim hover:text-ink">Remover foto</button>
                        </form>
                      ) : (
                        <ReferenciaUpload
                          rotulo={`Enviar ${a.rotulo.toLowerCase()}`}
                          brandId={b.id}
                          aoEnviar={setPersonagemFotoAction.bind(null, b.id, slug, p.id, a.id)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {personagens.length < MAX_PERSONAGENS && (
          <form action={criarPersonagemForm.bind(null, b.id, slug)} className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label htmlFor="nome-personagem" className={labelCls}>Novo personagem</label>
              <input id="nome-personagem" name="nome" required maxLength={80} placeholder="ex: Bruno" className={inputCls} />
            </div>
            <button type="submit" className={btnPrimary}>Criar personagem</button>
          </form>
        )}
      </section>
    </>
  );
}
