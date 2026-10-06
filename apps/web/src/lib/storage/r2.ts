import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { FileStorage } from "@hospedagens/core";

/**
 * Adaptador S3 para o Cloudflare R2 (qualquer serviço compatível com S3
 * funciona). Configuração em `docs/setup/cloudflare-r2.md`.
 */
class S3FileStorage implements FileStorage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly publicUrl: string,
  ) {}

  async put({ key, body, contentType }: { key: string; body: Uint8Array; contentType: string }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Chaves são únicas por upload, então o arquivo nunca muda.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { url: `${this.publicUrl}/${key}` };
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  keyFromUrl(url: string) {
    const prefix = `${this.publicUrl}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }
}

let cached: FileStorage | null | undefined;

/** Storage configurado, ou `null` se faltar alguma variável `R2_*`. */
export function getFileStorage(): FileStorage | null {
  if (cached !== undefined) return cached;

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
    R2_ENDPOINT,
  } = process.env;
  const endpoint =
    R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

  if (!endpoint || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    cached = null;
    return cached;
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    // Emuladores locais (R2_ENDPOINT) costumam exigir URLs no estilo /bucket/chave.
    forcePathStyle: Boolean(R2_ENDPOINT),
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  cached = new S3FileStorage(client, R2_BUCKET, R2_PUBLIC_URL.replace(/\/+$/, ""));
  return cached;
}
