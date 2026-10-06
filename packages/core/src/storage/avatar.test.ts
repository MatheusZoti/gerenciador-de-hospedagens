import { describe, expect, it } from "vitest";
import { ValidationError } from "../shared/errors";
import { AVATAR_MAX_BYTES, avatarKey, validateAvatarUpload } from "./avatar";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);

describe("validateAvatarUpload", () => {
  it.each([
    [PNG, "image/png", "png"],
    [JPG, "image/jpeg", "jpg"],
    [WEBP, "image/webp", "webp"],
  ])("reconhece o formato pelo conteúdo (%#)", (file, contentType, extension) => {
    expect(validateAvatarUpload(file)).toEqual({ contentType, extension });
  });

  it("recusa conteúdo que não é imagem, mesmo com extensão de imagem", () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    expect(() => validateAvatarUpload(html)).toThrow("JPG, PNG ou WebP");
  });

  it("recusa arquivo vazio ou maior que 2 MB", () => {
    expect(() => validateAvatarUpload(new Uint8Array())).toThrow(ValidationError);
    const big = new Uint8Array(AVATAR_MAX_BYTES + 1);
    big.set(PNG);
    expect(() => validateAvatarUpload(big)).toThrow("2 MB");
  });
});

describe("avatarKey", () => {
  it("guarda por usuário com nome aleatório", () => {
    expect(avatarKey("user-1", "png")).toMatch(/^avatars\/user-1\/[0-9a-f-]{36}\.png$/);
  });
});
