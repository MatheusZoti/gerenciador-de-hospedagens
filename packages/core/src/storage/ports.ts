/**
 * Porta de armazenamento de arquivos. Adaptador atual: Cloudflare R2
 * (`apps/web/src/lib/storage/r2.ts`). Qualquer serviço compatível com S3
 * pode implementar esta interface.
 */
export interface FileStorage {
  put(input: { key: string; body: Uint8Array; contentType: string }): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
  /** Chave do objeto a partir de uma URL pública deste storage; `null` se não for dele. */
  keyFromUrl(url: string): string | null;
}
