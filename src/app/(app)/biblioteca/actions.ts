"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { deleteMedia, listMedia } from "@/server/media";
import { listPosts } from "@/server/posts";
import { s3 } from "@/server/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSettings, setSettings } from "@/server/settings";

// B50: excluir midia so quando nenhum post a usa. Some do armazenamento e da biblioteca.
export async function removeMedia(id: string): Promise<void> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
  const m = (await listMedia()).find((x) => x.id === id);
  if (!m) redirect("/biblioteca?erro=" + encodeURIComponent("mídia não encontrada"));
  const posts = (await listPosts()).filter((p) => !p.deleted_at && p.media.includes(m.url));
  if (posts.length > 0) redirect("/biblioteca?erro=" + encodeURIComponent(`usada em ${posts.length} post(s): tire dos posts antes de excluir`));
  if (m.key) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: m.key }));
    } catch {
      redirect("/biblioteca?erro=" + encodeURIComponent("não consegui apagar o arquivo no armazenamento; tente de novo"));
    }
  }
  await deleteMedia(id);
  revalidatePath("/biblioteca");
}

// D21: versoes do arquivo (historico simulado no app_settings, mais recente primeiro)
export async function salvarVersaoMidia(id: string, formData: FormData) {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (!isAuthenticated) redirect("/logto/sign-in");
  const nota = String(formData.get("nota") ?? "").trim() || "nova versão";
  const chave = `midia.versoes.${id}`;
  const s = await getSettings();
  let lista: { quando: string; nota: string }[] = [];
  try {
    lista = JSON.parse(s[chave] || "[]");
  } catch {
    lista = [];
  }
  lista = [{ quando: new Date().toISOString(), nota }, ...lista].slice(0, 20);
  await setSettings({ [chave]: JSON.stringify(lista) });
  revalidatePath(`/biblioteca/${id}`);
}
