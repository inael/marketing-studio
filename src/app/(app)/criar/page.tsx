import { listBrands, avatarOf } from "@/server/brands";
import { listPosts } from "@/server/posts";
import { listMedia } from "@/server/media";
import { listTimeslots } from "@/server/timeslots";
import { CreateForm } from "@/components/create-form";
import { PageHeader, Empty } from "@/components/ui";
import Link from "next/link";
import { btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CriarPage({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  const { assunto } = await searchParams;
  const brandsRaw = await listBrands();
  const brands = brandsRaw.map((b) => ({
    id: b.id,
    slug: b.slug,
    nome: b.nome,
    cor_principal: b.cor_principal,
    avatar: avatarOf(b),
    ig: Boolean(b.ig_user_id) || Boolean(process.env[`META_${b.slug.toUpperCase()}_IG_USER_ID`]),
  }));

  // D15: posts ja agendados (todas as marcas) e janelas de publicacao de cada marca
  const [posts, janelasPorMarca, midia] = await Promise.all([
    listPosts(),
    Promise.all(brandsRaw.map((b) => listTimeslots(b.id))),
    listMedia(),
  ]);
  const nomeDe = new Map(brandsRaw.map((b) => [b.id, b.nome]));
  const agenda = posts
    .filter((p) => p.scheduled_at && (p.status === "scheduled" || p.status === "approved"))
    .map((p) => ({
      brand_id: p.brand_id,
      nome: nomeDe.get(p.brand_id) ?? "?",
      scheduled_at: p.scheduled_at as string,
    }));
  const janelas = janelasPorMarca.flatMap((lista) =>
    lista.map((j) => ({ brand_id: j.brand_id, weekday: j.weekday, hour: j.hour, minute: j.minute })),
  );

  // D12: data do ultimo post publicado de cada marca
  const ultimoPorMarca = new Map<string, string>();
  for (const p of posts) {
    if (p.status !== "published" || p.deleted_at) continue;
    const atualU = ultimoPorMarca.get(p.brand_id);
    if (!atualU || new Date(p.updated_at) > new Date(atualU)) ultimoPorMarca.set(p.brand_id, p.updated_at);
  }
  const brandsView = brands.map((b) => ({ ...b, ultimo: ultimoPorMarca.get(b.id) ?? null }));
  // M43: hashtags mais usadas por marca, para os chips do formulario
  const contagem = new Map<string, Map<string, number>>();
  for (const p of posts) {
    if (p.deleted_at) continue;
    const mapa = contagem.get(p.brand_id) ?? new Map<string, number>();
    for (const t of p.hashtags ?? []) mapa.set(t, (mapa.get(t) ?? 0) + 1);
    contagem.set(p.brand_id, mapa);
  }
  const hashtagsSugeridas: Record<string, string[]> = {};
  for (const [bid, mapa] of contagem) {
    hashtagsSugeridas[bid] = [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }

  return (
    <>
      <PageHeader
        title="Criar post"
        subtitle="Monte o post e veja o preview. Salve como rascunho, agende ou publique agora."
      />
      {brands.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-panel p-4">
            <div className="text-sm font-medium text-ink">1. Manual</div>
            <p className="mt-1 text-xs text-dim">
              Escreva a legenda e suba a imagem você mesmo, no formulário abaixo.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <div className="text-sm font-medium text-ink">2. Com auxílio da IA</div>
            <p className="mt-1 text-xs text-dim">
              No formulário: <span className="text-info">✦ Gerar com IA</span> escreve a legenda e o
              campo <span className="text-info">Gerar imagem</span> cria a arte.
            </p>
          </div>
          <Link href="/sugestoes" className="rounded-lg border border-line bg-panel p-4 transition-colors hover:border-line2">
            <div className="text-sm font-medium text-ink">3. Sugestões do time →</div>
            <p className="mt-1 text-xs text-dim">
              O time de agentes analisa notícias e concorrentes e propõe 6 posts. Você aceita e vira
              rascunho aqui.
            </p>
          </Link>
        </div>
      )}
      {brands.length === 0 ? (
        <Empty
          title="Nenhuma marca ativa"
          hint="Ative ao menos uma marca para criar posts."
          action={
            <Link href="/marcas" className={btnPrimary}>
              Ir para Marcas
            </Link>
          }
        />
      ) : (
        <CreateForm
          assuntoInicial={assunto}
          brands={brandsView}
          agenda={agenda}
          janelas={janelas}
          biblioteca={midia.map((m) => ({ id: m.id, url: m.url, brand_id: m.brand_id, tipo: m.tipo }))}
          hashtagsSugeridas={hashtagsSugeridas}
        />
      )}
    </>
  );
}
