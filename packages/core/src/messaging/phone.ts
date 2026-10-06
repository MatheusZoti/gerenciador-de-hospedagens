/**
 * Normaliza um telefone para E.164 sem o `+` (formato usado pelo wa.me e pela
 * WhatsApp Cloud API). Números brasileiros sem DDI recebem `55`.
 *
 *   "(11) 98765-4321"   → "5511987654321"
 *   "+55 11 98765-4321" → "5511987654321"
 *   "+1 415 555 2671"   → "14155552671"
 *
 * Retorna `null` quando o valor não parece um telefone válido.
 * Ao internacionalizar o produto, trocar por `libphonenumber-js`.
 */
export function normalizePhone(raw: string, defaultCountryCode = "55"): string | null {
  const hasPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (!hasPlus && (digits.length === 10 || digits.length === 11)) {
    digits = `${defaultCountryCode}${digits}`;
  }

  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}
