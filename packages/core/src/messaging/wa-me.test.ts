import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";
import { defaultWhatsAppMessage, WaMeLinkProvider } from "./wa-me";

describe("normalizePhone", () => {
  it.each([
    ["(11) 98765-4321", "5511987654321"],
    ["+55 11 98765-4321", "5511987654321"],
    ["0055 11 98765-4321", "5511987654321"],
    ["(12) 3456-7890", "551234567890"],
    ["+1 415 555 2671", "14155552671"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(["", "123", "abc", "+99 1234 5678 9012 3456"])("rejeita %j", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });
});

describe("WaMeLinkProvider", () => {
  const provider = new WaMeLinkProvider();

  it("monta o link com o telefone normalizado e o texto codificado", () => {
    expect(provider.getConversationLink("(11) 98765-4321", "Olá, Ana! Tudo bem?")).toBe(
      "https://wa.me/5511987654321?text=Ol%C3%A1%2C+Ana%21+Tudo+bem%3F",
    );
  });

  it("omite o texto quando vazio", () => {
    expect(provider.getConversationLink("11987654321", "  ")).toBe("https://wa.me/5511987654321");
  });

  it("retorna null para telefone inválido", () => {
    expect(provider.getConversationLink("123")).toBeNull();
  });
});

describe("defaultWhatsAppMessage", () => {
  it("usa o primeiro nome e o imóvel de interesse", () => {
    expect(defaultWhatsAppMessage({ leadName: "Ana Souza", propertyName: "Chalé da Serra" })).toBe(
      "Olá, Ana! Tudo bem? Estou entrando em contato sobre a hospedagem Chalé da Serra.",
    );
  });

  it("funciona sem imóvel", () => {
    expect(defaultWhatsAppMessage({ leadName: "Ana" })).toBe("Olá, Ana! Tudo bem?");
  });
});
