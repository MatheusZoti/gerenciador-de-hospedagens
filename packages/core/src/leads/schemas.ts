import { normalizePhone } from "../messaging/phone";
import { z } from "../shared/zod";

export const LEAD_SOURCES = [
  "whatsapp",
  "site",
  "airbnb",
  "instagram",
  "indicacao",
  "outro",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/**
 * Texto opcional. `undefined` = não mexer (em edições); `null` ou "" = limpar.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value === "" ? null : value));

const optionalDate = z.iso.date("Data inválida").nullish();

const leadFields = {
  name: z.string().trim().min(2, "Informe o nome do lead").max(120),
  phone: optionalText(40).refine(
    (value) => value == null || normalizePhone(value) !== null,
    "Telefone inválido",
  ),
  email: z.email("E-mail inválido").nullish(),
  source: z.enum(LEAD_SOURCES),
  propertyOfInterestId: z.string().min(1).nullish(),
  /** Etapa do funil; na criação, se omitida, usa a primeira etapa aberta. */
  stageId: z.string().min(1).optional(),
  desiredCheckIn: optionalDate,
  desiredCheckOut: optionalDate,
  guests: z.number().int().positive().max(100).nullish(),
  birthday: optionalDate,
  notes: optionalText(5000),
  lostReason: optionalText(500),
  lastMessageAt: z.date().nullish(),
};

export const DATES_OUT_OF_ORDER = "Check-out deve ser depois do check-in";

export function datesInOrder(checkIn?: string | null, checkOut?: string | null) {
  return !checkIn || !checkOut || checkOut > checkIn;
}

export const createLeadSchema = z
  .object({ ...leadFields, source: leadFields.source.default("whatsapp") })
  .refine((lead) => datesInOrder(lead.desiredCheckIn, lead.desiredCheckOut), {
    message: DATES_OUT_OF_ORDER,
    path: ["desiredCheckOut"],
  });

/** Edição parcial: só os campos enviados são alterados. */
export const updateLeadSchema = z
  .object(leadFields)
  .partial()
  .refine((lead) => datesInOrder(lead.desiredCheckIn, lead.desiredCheckOut), {
    message: DATES_OUT_OF_ORDER,
    path: ["desiredCheckOut"],
  });

export const moveLeadSchema = z.object({
  leadId: z.string().min(1),
  toStageId: z.string().min(1),
  /** Posição na coluna de destino, de cima para baixo (0 = topo). */
  toIndex: z.number().int().min(0),
});

export const leadFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  stageId: z.string().min(1).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  propertyId: z.string().min(1).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const leadNoteSchema = z.object({
  text: z.string().trim().min(1, "Escreva a nota").max(5000),
});

export type CreateLeadInput = z.input<typeof createLeadSchema>;
export type UpdateLeadInput = z.input<typeof updateLeadSchema>;
export type MoveLeadInput = z.input<typeof moveLeadSchema>;
export type LeadFilters = z.input<typeof leadFiltersSchema>;
