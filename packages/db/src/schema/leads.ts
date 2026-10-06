import { date, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, id, timestamps } from "./_shared";
import { organization, user } from "./auth";
import { pipelineStage } from "./pipeline";
import { property } from "./properties";

export const leadSource = pgEnum("lead_source", [
  "whatsapp",
  "site",
  "airbnb",
  "instagram",
  "indicacao",
  "outro",
]);

export const leadActivityType = pgEnum("lead_activity_type", [
  "created",
  "stage_changed",
  "note",
  "message",
  "call",
]);

/** Pessoa interessada em uma hospedagem; percorre o funil de vendas. */
export const lead = pgTable(
  "lead",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Telefone normalizado em E.164 sem o `+` (ex.: `5511987654321`). */
    phone: text("phone"),
    email: text("email"),
    source: leadSource("source").notNull().default("whatsapp"),
    propertyOfInterestId: text("property_of_interest_id").references(() => property.id, {
      onDelete: "set null",
    }),
    stageId: text("stage_id")
      .notNull()
      .references(() => pipelineStage.id, { onDelete: "restrict" }),
    /** Ordem do card na coluna do Kanban (maior = mais acima). */
    boardPosition: integer("board_position").notNull().default(0),
    desiredCheckIn: date("desired_check_in"),
    desiredCheckOut: date("desired_check_out"),
    guests: integer("guests"),
    birthday: date("birthday"),
    notes: text("notes"),
    lostReason: text("lost_reason"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (t) => [
    index("lead_org_stage_idx").on(t.organizationId, t.stageId, t.boardPosition),
    index("lead_org_phone_idx").on(t.organizationId, t.phone),
  ],
);

/** Linha do tempo do lead (mudanças de etapa, notas, mensagens, ligações). */
export const leadActivity = pgTable(
  "lead_activity",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => lead.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    type: leadActivityType("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("lead_activity_org_lead_idx").on(t.organizationId, t.leadId, t.createdAt)],
);
