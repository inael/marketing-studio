import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  ListPartsCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/server/r2";

// M45: upload em partes direto para o R2. O navegador envia cada parte com uma URL assinada,
// e se a conexao cai ele pergunta quais partes ja chegaram e continua dali.
const bucket = () => process.env.R2_BUCKET;

export async function iniciarMultipart(key: string, contentType: string): Promise<string> {
  const r = await s3.send(new CreateMultipartUploadCommand({ Bucket: bucket(), Key: key, ContentType: contentType }));
  if (!r.UploadId) throw new Error("não consegui iniciar o envio");
  return r.UploadId;
}

export function urlParte(key: string, uploadId: string, numero: number): Promise<string> {
  return getSignedUrl(s3, new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: numero }), { expiresIn: 3600 });
}

export async function partesRecebidas(key: string, uploadId: string): Promise<{ numero: number; etag: string }[]> {
  const out: { numero: number; etag: string }[] = [];
  let marker: string | undefined;
  do {
    const r = await s3.send(new ListPartsCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumberMarker: marker }));
    for (const p of r.Parts ?? []) if (p.PartNumber && p.ETag) out.push({ numero: p.PartNumber, etag: p.ETag });
    marker = r.IsTruncated ? r.NextPartNumberMarker : undefined;
  } while (marker);
  return out;
}

export async function concluirMultipart(key: string, uploadId: string, partes: { numero: number; etag: string }[]) {
  await s3.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: partes.sort((a, b) => a.numero - b.numero).map((p) => ({ PartNumber: p.numero, ETag: p.etag })) },
    }),
  );
}

export async function cancelarMultipart(key: string, uploadId: string) {
  await s3.send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId }));
}

export const urlPublicaDe = (key: string) => `${process.env.R2_PUBLIC_BASE}/${key}`;
