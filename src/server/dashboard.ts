import { sql } from "./db";
import { listAllBrands } from "./brands";
import { getSettings } from "./settings";
import { resolveIg } from "./planner";

export type DashboardData = {
  posts: Record<string, number>;
  deleted: number;
  publishedWeek: number;
  brandsAtivas: number;
  suggestions: number;
  nextScheduled: {
    id: string;
    slug: string;
    nome: string;
    cor: string;
    legenda: string;
    scheduled_at: string;
    tipo: string;
  }[];
  pendingByBrand: { slug: string; nome: string; cor: string; drafts: number }[];
  connections: {
    slug: string;
    nome: string;
    cor: string;
    ig: boolean;
    linkedin: boolean;
    picture: string | null;
  }[];
  automation: { sugestoes: boolean; gestor: boolean };
};

export async function dashboardSummary(): Promise<DashboardData> {
  const [statusRows, delRow, weekRow, sugRow, nextRows, pendRows, brands, settings] =
    await Promise.all([
      sql<{ status: string; n: number }[]>`
        select status, count(*)::int as n from posts where deleted_at is null group by status`,
      sql<{ n: number }[]>`select count(*)::int as n from posts where deleted_at is not null`,
      sql<{ n: number }[]>`
        select count(*)::int as n from posts
        where status='published' and deleted_at is null and updated_at >= now() - interval '7 days'`,
      sql<{ n: number }[]>`select count(*)::int as n from suggestions where status='nova'`,
      sql<
        { id: string; slug: string; nome: string; cor: string; legenda: string; scheduled_at: string; tipo: string }[]
      >`
        select p.id, b.slug, b.nome, b.cor_principal as cor, p.legenda, p.scheduled_at, p.tipo
        from posts p join brands b on b.id = p.brand_id
        where p.status='scheduled' and p.deleted_at is null and p.scheduled_at is not null
        order by p.scheduled_at asc limit 6`,
      sql<{ slug: string; nome: string; cor: string; drafts: number }[]>`
        select b.slug, b.nome, b.cor_principal as cor, count(*)::int as drafts
        from posts p join brands b on b.id = p.brand_id
        where p.status='draft' and p.deleted_at is null
        group by b.slug, b.nome, b.cor_principal
        order by drafts desc`,
      listAllBrands(),
      getSettings(),
    ]);

  const posts = Object.fromEntries(statusRows.map((r) => [r.status, r.n]));

  const connections = brands
    .filter((b) => b.ativo)
    .map((b) => ({
      slug: b.slug,
      nome: b.nome,
      cor: b.cor_principal,
      ig: Boolean(resolveIg(b)),
      linkedin: Boolean(b.linkedin_org_id),
      picture: b.ig_picture,
    }));

  return {
    posts,
    deleted: delRow[0]?.n ?? 0,
    publishedWeek: weekRow[0]?.n ?? 0,
    brandsAtivas: brands.filter((b) => b.ativo).length,
    suggestions: sugRow[0]?.n ?? 0,
    nextScheduled: nextRows,
    pendingByBrand: pendRows,
    connections,
    automation: {
      sugestoes: settings.automacao_ativa === "on",
      gestor: settings.automacao_gestor === "on",
    },
  };
}
