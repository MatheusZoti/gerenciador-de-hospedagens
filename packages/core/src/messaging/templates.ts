/**
 * Modelos de mensagem do WhatsApp. Módulo PURO (sem banco, sem Node): também
 * é exportado em `@hospedagens/core/templates` para a pré-visualização ao
 * vivo no navegador. Não importe nada com efeito colateral aqui.
 */

export const TEMPLATE_VARIABLES = [
  { key: "primeiro_nome", label: "Primeiro nome", example: "Ana" },
  { key: "nome", label: "Nome completo", example: "Ana Beatriz Souza" },
  { key: "imovel", label: "Imóvel de interesse", example: "Casa Pé na Areia" },
  { key: "checkin", label: "Check-in", example: "15/11" },
  { key: "checkout", label: "Check-out", example: "20/11" },
  { key: "hospedes", label: "Hóspedes", example: "4" },
  { key: "organizacao", label: "Sua organização", example: "Hospedagens de Matheus" },
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number]["key"];
export type TemplateValues = Partial<Record<TemplateVariable, string | number | null | undefined>>;

/** Usado quando a organização não tem modelo padrão salvo. */
export const DEFAULT_TEMPLATE_BODY = "Olá, {primeiro_nome}! Tudo bem? Aqui é da {organizacao}.";

export const TEMPLATE_MAX_LENGTH = 1000;

const KNOWN = new Set<string>(TEMPLATE_VARIABLES.map((variable) => variable.key));
const PLACEHOLDER = /\{([a-z_]+)\}/g;

export const TEMPLATE_EXAMPLE_VALUES: TemplateValues = Object.fromEntries(
  TEMPLATE_VARIABLES.map((variable) => [variable.key, variable.example]),
);

/** Variáveis `{...}` do texto que não existem (ex.: erro de digitação). */
export function unknownTemplateVariables(body: string): string[] {
  const unknown = new Set<string>();
  for (const [, key] of body.matchAll(PLACEHOLDER)) {
    if (key && !KNOWN.has(key)) unknown.add(key);
  }
  return [...unknown];
}

/**
 * Preenche as variáveis. Variável sem valor some, e espaços duplicados ou
 * antes de pontuação são limpos ("sobre a hospedagem {imovel}." sem imóvel
 * vira "sobre a hospedagem."). Variáveis desconhecidas ficam como estão.
 */
export function renderTemplate(body: string, values: TemplateValues): string {
  const filled = body.replace(PLACEHOLDER, (match, key: string) => {
    if (!KNOWN.has(key)) return match;
    const value = values[key as TemplateVariable];
    return value === null || value === undefined ? "" : String(value);
  });

  return filled
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]{2,}/g, " ")
        .replace(/[ \t]+([,.!?;:])/g, "$1")
        .trim(),
    )
    .join("\n")
    .trim();
}

export interface MessageTemplates {
  /** Modelo padrão da organização (ou `DEFAULT_TEMPLATE_BODY`). */
  defaultBody: string;
  /** Modelos personalizados por id de etapa. */
  byStage: Record<string, string>;
}

/** Modelo da etapa, ou o padrão da organização quando a etapa não tem um. */
export function pickTemplate(templates: MessageTemplates, stageId: string): string {
  return templates.byStage[stageId] ?? templates.defaultBody;
}

/** "2026-11-15" → "15/11" */
function shortDate(isoDate: string | null | undefined) {
  if (!isoDate) return null;
  const [, month, day] = isoDate.split("-");
  return day && month ? `${day}/${month}` : null;
}

export interface LeadMessageData {
  name: string;
  propertyName?: string | null;
  desiredCheckIn?: string | null;
  desiredCheckOut?: string | null;
  guests?: number | null;
}

/** Mensagem pronta para um lead, a partir do modelo. */
export function composeLeadMessage(
  body: string,
  lead: LeadMessageData,
  extras: { organizationName?: string | null } = {},
): string {
  const name = lead.name.trim();
  return renderTemplate(body, {
    nome: name,
    primeiro_nome: name.split(/\s+/)[0],
    imovel: lead.propertyName,
    checkin: shortDate(lead.desiredCheckIn),
    checkout: shortDate(lead.desiredCheckOut),
    hospedes: lead.guests,
    organizacao: extras.organizationName,
  });
}
