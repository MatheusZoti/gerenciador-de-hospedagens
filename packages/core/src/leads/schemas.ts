import { z } from "zod";
import { normalizePhone } from "../messaging/phone";

export const LEAD_SOURCES = [
  "whatsapp",
  "site",
  "airbnb",
  "instagram",
  "indicacao",
  "outro",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const createLeadSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do lead").max(120),
    phone: optionalText(40).refine(
      (value) => value === undefined || normalizePhone(value) !== null,
      "Telefone inválido",
    ),
    email: z.email("E-mail inválido").optional(),
    source: z.enum(LEAD_SOURCES).default("whatsapp"),
    propertyOfInterestId: z.string().min(1).optional(),
    /** Etapa inicial; se omitida, usa a primeira etapa aberta do funil. */
    stageId: z.string().min(1).optional(),
    desiredCheckIn: z.iso.date().optional(),
    desiredCheckOut: z.iso.date().optional(),
    guests: z.number().int().positive().max(100).optional(),
    notes: optionalText(5000),
    lastMessageAt: z.date().optional(),
  })
  .refine(
    (lead) =>
      !lead.desiredCheckIn || !lead.desiredCheckOut || lead.desiredCheckOut > lead.desiredCheckIn,
    { message: "Check-out deve ser depois do check-in", path: ["desiredCheckOut"] },
  );

export type CreateLeadInput = z.input<typeof createLeadSchema>;
