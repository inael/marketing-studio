import { NextResponse, type NextRequest } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { getBrandById, type Brand } from "@/server/brands";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Resolve conta IG pela marca (creds no banco ou variável de ambiente).
function resolveIg(brand: Brand): { id: string; token: string } | null {
  if (brand.ig_user_id && brand.ig_token) {
    return { id: brand.ig_user_id, token: brand.ig_token };
  }
  const p = brand.slug.toUpperCase();
  const id = process.env[`META_${p}_IG_USER_ID`];
  const token = process.env[`META_${p}_ACCESS_TOKEN`];
  return id && token ? { id, token } : null;
}

export async function POST(req: NextRequest) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { brandId, network } = (await req.json().catch(() => ({}))) as {
    brandId?: string;
    network?: string;
  };
  const brand = brandId ? await getBrandById(brandId) : null;
  if (!brand) return NextResponse.json({ error: "marca inválida" }, { status: 400 });
  if (network !== "instagram") {
    return NextResponse.json({ error: "rede não suportada ainda" }, { status: 400 });
  }

  const acc = resolveIg(brand);
  if (!acc) {
    return NextResponse.json({ error: "sem credenciais de Instagram" }, { status: 400 });
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${acc.id}?fields=username,profile_picture_url&access_token=${encodeURIComponent(
      acc.token
    )}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "token inválido ou sem permissão" },
        { status: 502 }
      );
    }
    return NextResponse.json({ username: data.username, picture: data.profile_picture_url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "falha ao verificar" },
      { status: 502 }
    );
  }
}
