export type StageKind = "open" | "won" | "lost";

export interface StageTemplate {
  name: string;
  color: string;
  kind: StageKind;
}

/**
 * Etapas criadas para toda nova organização (podem ser editadas depois).
 * As cores das etapas abertas + "Fechado" formam uma paleta categórica
 * validada (separação para daltonismo); a cor sempre aparece junto do nome
 * da etapa. "Perdido" usa cinza de propósito (etapa sem destaque).
 */
export const DEFAULT_PIPELINE_STAGES: readonly StageTemplate[] = [
  { name: "Novo lead", color: "sky", kind: "open" },
  { name: "Em conversa", color: "violet", kind: "open" },
  { name: "Pronto para fechar", color: "amber", kind: "open" },
  { name: "Aguardando pagamento", color: "pink", kind: "open" },
  { name: "Fechado", color: "emerald", kind: "won" },
  { name: "Perdido", color: "slate", kind: "lost" },
];
