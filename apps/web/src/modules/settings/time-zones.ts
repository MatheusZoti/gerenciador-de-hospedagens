/** Fusos oferecidos na tela de organização (o core aceita qualquer fuso IANA). */
export const TIME_ZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "Horário de Brasília (UTC−3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
  { value: "America/Manaus", label: "Amazonas (UTC−4)" },
  { value: "America/Cuiaba", label: "Mato Grosso (UTC−4)" },
  { value: "America/Campo_Grande", label: "Mato Grosso do Sul (UTC−4)" },
  { value: "America/Porto_Velho", label: "Rondônia (UTC−4)" },
  { value: "America/Boa_Vista", label: "Roraima (UTC−4)" },
  { value: "America/Rio_Branco", label: "Acre (UTC−5)" },
  { value: "Europe/Lisbon", label: "Lisboa, Portugal" },
  { value: "UTC", label: "UTC" },
] as const;

export function timeZoneOptions(current: string) {
  const known = TIME_ZONE_OPTIONS.some((option) => option.value === current);
  return known
    ? [...TIME_ZONE_OPTIONS]
    : [...TIME_ZONE_OPTIONS, { value: current, label: current }];
}
