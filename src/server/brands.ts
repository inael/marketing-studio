import { sql } from "./db";

export type Brand = {
  id: string;
  slug: string;
  nome: string;
  cor_principal: string;
  cor_apoio: string[];
  fonte: string;
  tom_voz: string;
  ig_user_id: string | null;
  ig_token: string | null;
  linkedin_org_id: string | null;
  linkedin_token: string | null;
  site_url: string;
  ativo: boolean;
};

export async function getBrand(slug: string): Promise<Brand | null> {
  const [b] = await sql<Brand[]>`select * from brands where slug = ${slug} limit 1`;
  return b ?? null;
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const [b] = await sql<Brand[]>`select * from brands where id = ${id} limit 1`;
  return b ?? null;
}

/** só marcas ativas (uso operacional: criar/publicar) */
export async function listBrands(): Promise<Brand[]> {
  return sql<Brand[]>`select * from brands where ativo order by nome`;
}

/** todas, ativas primeiro (tela de gestão) */
export async function listAllBrands(): Promise<Brand[]> {
  return sql<Brand[]>`select * from brands order by ativo desc, nome`;
}

export type BrandPatch = Partial<
  Pick<
    Brand,
    | "nome"
    | "cor_principal"
    | "cor_apoio"
    | "fonte"
    | "tom_voz"
    | "ig_user_id"
    | "ig_token"
    | "linkedin_org_id"
    | "linkedin_token"
    | "site_url"
    | "ativo"
  >
>;

export async function updateBrand(id: string, patch: BrandPatch): Promise<void> {
  const keys = Object.keys(patch) as string[];
  if (keys.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sql`update brands set ${sql(patch as any, ...keys)} where id = ${id}`;
}

export async function createBrand(
  input: Pick<Brand, "slug" | "nome" | "cor_principal" | "fonte" | "tom_voz" | "site_url"> &
    Partial<Brand>
): Promise<Brand> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [b] = await sql<Brand[]>`insert into brands ${sql(input as any)} returning *`;
  return b;
}
