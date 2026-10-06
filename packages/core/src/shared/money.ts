import { ValidationError } from "./errors";

/**
 * Converte um valor digitado em reais para centavos.
 *
 *   "650"          → 65000
 *   "650,5"        → 65050
 *   "R$ 1.234,56"  → 123456
 *   "1234.56"      → 123456
 *
 * Vazio vira `null`. Valor inválido lança `ValidationError`.
 */
export function parseMoneyToCents(raw: string | null | undefined): number | null {
  const value = (raw ?? "").replace(/R\$|\s/g, "");
  if (!value) return null;

  let normalized = value;
  if (value.includes(",")) {
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else if ((value.match(/\./g) ?? []).length > 1 || /^\d{1,3}(\.\d{3})+$/.test(value)) {
    normalized = value.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new ValidationError(`Valor em reais inválido: "${raw}"`);
  }
  return Math.round(Number(normalized) * 100);
}

/** 65050 → "650,50" (para preencher campos de formulário). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
