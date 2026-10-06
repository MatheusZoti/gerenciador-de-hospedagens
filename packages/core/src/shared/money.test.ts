import { describe, expect, it } from "vitest";
import { ValidationError } from "./errors";
import { centsToInput, parseMoneyToCents } from "./money";

describe("parseMoneyToCents", () => {
  it.each([
    ["650", 65000],
    ["650,5", 65050],
    ["650,50", 65050],
    ["R$ 1.234,56", 123456],
    ["1.234", 123400],
    ["1234.56", 123456],
    ["0", 0],
  ])("%s → %d", (raw, cents) => {
    expect(parseMoneyToCents(raw)).toBe(cents);
  });

  it("vazio vira null", () => {
    expect(parseMoneyToCents("")).toBeNull();
    expect(parseMoneyToCents("  ")).toBeNull();
    expect(parseMoneyToCents(null)).toBeNull();
  });

  it.each(["abc", "12,345", "-10", "1,2,3"])("rejeita %j", (raw) => {
    expect(() => parseMoneyToCents(raw)).toThrow(ValidationError);
  });
});

describe("centsToInput", () => {
  it("formata para o campo do formulário", () => {
    expect(centsToInput(65050)).toBe("650,50");
    expect(centsToInput(null)).toBe("");
  });
});
