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
  site_url: string;
  ativo: boolean;
};

export async function getBrand(slug: string): Promise<Brand | null> {
  const [b] = await sql<Brand[]>`select * from brands where slug = ${slug} limit 1`;
  return b ?? null;
}

export async function listBrands(): Promise<Brand[]> {
  return sql<Brand[]>`select * from brands where ativo order by nome`;
}
