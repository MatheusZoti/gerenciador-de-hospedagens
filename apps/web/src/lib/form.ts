/**
 * Leitura tipada de FormData. Campo vazio vira `null` (= limpar o valor);
 * campo ausente do formulário vira `undefined` (= não mexer).
 */
export function text(form: FormData, key: string): string | null | undefined {
  const value = form.get(key);
  if (value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export function requiredText(form: FormData, key: string): string {
  return text(form, key) ?? "";
}

export function integer(form: FormData, key: string): number | null | undefined {
  const value = text(form, key);
  if (value === undefined || value === null) return value;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}
