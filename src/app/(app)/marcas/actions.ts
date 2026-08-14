"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { updateBrand, listAllBrands, type BrandPatch } from "@/server/brands";
import { addTimeslot, removeTimeslot } from "@/server/timeslots";
import { addSource, removeSource, type SourceKind } from "@/server/sources";
import { getOauthSession, deleteOauthSession } from "@/server/oauth";
import { resolveIg } from "@/server/planner";

async function requireAuth() {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function saveBrand(id: string, formData: FormData) {
  await requireAuth();

  const patch: BrandPatch = {
    nome: str(formData, "nome"),
    cor_principal: str(formData, "cor_principal"),
    site_url: str(formData, "site_url"),
    fonte: str(formData, "fonte"),
    tom_voz: str(formData, "tom_voz"),
    ig_user_id: str(formData, "ig_user_id") || null,
    linkedin_org_id: str(formData, "linkedin_org_id") || null,
    ativo: formData.get("ativo") === "on",
  };

  // tokens só são alterados se um novo for digitado (não sobrescreve com vazio)
  const igTok = str(formData, "ig_token");
  if (igTok) patch.ig_token = igTok;
  const lkTok = str(formData, "linkedin_token");
  if (lkTok) patch.linkedin_token = lkTok;

  await updateBrand(id, patch);
  revalidatePath("/marcas");
  redirect("/marcas");
}

export async function addSlot(brandId: string, slug: string, formData: FormData) {
  await requireAuth();
  const weekday = Number(formData.get("weekday"));
  const [h, m] = str(formData, "time").split(":").map(Number);
  if (Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && Number.isFinite(h)) {
    await addTimeslot(brandId, weekday, h, Number.isFinite(m) ? m : 0);
  }
  revalidatePath(`/marcas/${slug}`);
  redirect(`/marcas/${slug}`);
}

export async function removeSlot(id: string, slug: string) {
  await requireAuth();
  await removeTimeslot(id);
  revalidatePath(`/marcas/${slug}`);
  redirect(`/marcas/${slug}`);
}

export async function addSourceAction(brandId: string, slug: string, formData: FormData) {
  await requireAuth();
  const kind = String(formData.get("kind") ?? "") as SourceKind;
  let value = str(formData, "value");
  if (kind === "competitor") value = value.replace(/^@+/, "").replace(/\s+/g, "");
  if ((kind === "rss" || kind === "competitor") && value) {
    await addSource(brandId, kind, value);
  }
  revalidatePath(`/marcas/${slug}`);
  redirect(`/marcas/${slug}`);
}

export async function removeSourceAction(id: string, slug: string) {
  await requireAuth();
  await removeSource(id);
  revalidatePath(`/marcas/${slug}`);
  redirect(`/marcas/${slug}`);
}

const GRAPH = "https://graph.facebook.com/v21.0";

/** Busca a foto de perfil (e username) da conta IG de cada marca e salva.
 *  Roda no servidor de produção, onde os tokens de env estão disponíveis. */
export async function refreshBrandPhotos() {
  await requireAuth();
  const brands = await listAllBrands();
  await Promise.all(
    brands.map(async (b) => {
      const acc = resolveIg(b);
      if (!acc) return;
      try {
        const r = await fetch(
          `${GRAPH}/${acc.igUserId}?fields=profile_picture_url,username&access_token=${acc.token}`
        );
        const d = await r.json();
        if (d?.profile_picture_url) await updateBrand(b.id, { ig_picture: d.profile_picture_url });
      } catch {
        /* ignora marca que falhar; as outras seguem */
      }
    })
  );
  revalidatePath("/marcas");
  redirect("/marcas");
}

export async function finalizeInstagram(
  brandId: string,
  slug: string,
  sessionId: string,
  igId: string
) {
  await requireAuth();
  const session = await getOauthSession(sessionId);
  const acc = session?.accounts?.find((a: { igId: string }) => a.igId === igId) as
    | { igId: string; pageToken: string; picture?: string | null }
    | undefined;
  if (acc) {
    await updateBrand(brandId, {
      ig_user_id: acc.igId,
      ig_token: acc.pageToken,
      ig_picture: acc.picture ?? null,
    });
    await deleteOauthSession(sessionId);
  }
  revalidatePath(`/marcas/${slug}`);
  redirect(`/marcas/${slug}`);
}

export async function finalizeLinkedin(
  brandId: string,
  slug: string,
  sessionId: string,
  orgId: string
) {
  await requireAuth();
  const session = await getOauthSession(sessionId);
  const org = session?.orgs?.find((o: { orgId: string }) => o.orgId === orgId) as
    | { orgId: string; token: string }
    | undefined;
  if (org) {
    await updateBrand(brandId, { linkedin_org_id: org.orgId, linkedin_token: org.token });
    await deleteOauthSession(sessionId);
  }
  revalidatePath(`/marcas/${slug}`);
  redirect(`/marcas/${slug}`);
}
