import type { LeadSource } from "@hospedagens/core";

export const SOURCE_LABEL: Record<LeadSource, string> = {
  whatsapp: "WhatsApp",
  site: "Site",
  airbnb: "Airbnb",
  instagram: "Instagram",
  indicacao: "Indicação",
  outro: "Outro",
};

export const SOURCE_OPTIONS = Object.entries(SOURCE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export function isLeadSource(value: string | undefined): value is LeadSource {
  return value !== undefined && value in SOURCE_LABEL;
}
