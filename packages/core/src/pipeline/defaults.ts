export type StageKind = "open" | "won" | "lost";

/**
 * Cores permitidas para etapas. As 5 primeiras formam uma paleta categórica
 * validada para daltonismo; "slate" é o cinza neutro. A cor sempre aparece
 * junto do nome da etapa, então repetir cor entre etapas é aceitável.
 */
export const STAGE_COLORS = ["sky", "violet", "amber", "pink", "emerald", "slate"] as const;
export type StageColor = (typeof STAGE_COLORS)[number];

export const STAGE_COLOR_LABEL: Record<StageColor, string> = {
  sky: "Azul",
  violet: "Roxo",
  amber: "Âmbar",
  pink: "Rosa",
  emerald: "Verde",
  slate: "Cinza",
};

export interface StageTemplate {
  name: string;
  color: StageColor;
  kind: StageKind;
  /** Modelo de mensagem do WhatsApp sugerido para leads nesta etapa. */
  messageTemplate?: string;
}

/**
 * Etapas criadas para toda nova organização (podem ser editadas depois).
 * As cores das etapas abertas + "Fechado" formam uma paleta categórica
 * validada (separação para daltonismo); a cor sempre aparece junto do nome
 * da etapa. "Perdido" usa cinza de propósito (etapa sem destaque).
 */
export const DEFAULT_PIPELINE_STAGES: readonly StageTemplate[] = [
  {
    name: "Novo lead",
    color: "sky",
    kind: "open",
    messageTemplate:
      "Olá, {primeiro_nome}! Tudo bem? Aqui é da {organizacao}. Vi seu interesse na hospedagem {imovel}. Para quais datas e quantas pessoas você procura?",
  },
  {
    name: "Em conversa",
    color: "violet",
    kind: "open",
    messageTemplate:
      "Oi, {primeiro_nome}! Passando para dar continuidade à nossa conversa sobre a hospedagem {imovel}.",
  },
  {
    name: "Pronto para fechar",
    color: "amber",
    kind: "open",
    messageTemplate:
      "Oi, {primeiro_nome}! Tudo certo para garantir sua reserva de {checkin} a {checkout}? Posso te enviar os dados para pagamento?",
  },
  {
    name: "Aguardando pagamento",
    color: "pink",
    kind: "open",
    messageTemplate:
      "Oi, {primeiro_nome}! Passando para lembrar do pagamento da sua reserva de {checkin} a {checkout}. Assim que pagar, me envie o comprovante por aqui, por favor.",
  },
  {
    name: "Fechado",
    color: "emerald",
    kind: "won",
    messageTemplate:
      "Oi, {primeiro_nome}! Sua reserva está confirmada. Qualquer dúvida sobre a hospedagem, é só chamar por aqui.",
  },
  { name: "Perdido", color: "slate", kind: "lost" },
];
