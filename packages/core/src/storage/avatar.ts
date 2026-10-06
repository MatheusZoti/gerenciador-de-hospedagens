import { ValidationError } from "../shared/errors";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const FORMATS = [
  {
    contentType: "image/jpeg",
    extension: "jpg",
    matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    contentType: "image/png",
    extension: "png",
    matches: (b: Uint8Array) =>
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte),
  },
  {
    contentType: "image/webp",
    extension: "webp",
    // "RIFF" .... "WEBP"
    matches: (b: Uint8Array) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
] as const;

/**
 * Valida a foto de perfil pelo conteúdo (assinatura do arquivo), não pelo
 * tipo informado pelo navegador, que pode ser forjado.
 */
export function validateAvatarUpload(bytes: Uint8Array): {
  contentType: string;
  extension: string;
} {
  if (bytes.byteLength === 0) throw new ValidationError("Escolha uma imagem");
  if (bytes.byteLength > AVATAR_MAX_BYTES) {
    throw new ValidationError("A imagem deve ter no máximo 2 MB");
  }
  const format = FORMATS.find((candidate) => candidate.matches(bytes));
  if (!format) throw new ValidationError("Use uma imagem JPG, PNG ou WebP");
  return { contentType: format.contentType, extension: format.extension };
}

export function avatarKey(userId: string, extension: string): string {
  return `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
}
