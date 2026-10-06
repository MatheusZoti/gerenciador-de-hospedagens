import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, timestamps, updatedAt } from "./_shared";
import { organization } from "./auth";
import { pipelineStage } from "./pipeline";

/**
 * Preferências da organização. Fica fora da tabela `organization` (do Better
 * Auth) para não acoplar nosso domínio ao schema do provedor de autenticação.
 * Sem linha = valores padrão.
 */
export const organizationSettings = pgTable("organization_settings", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  /** Fuso IANA usado para exibir horários (ex.: `America/Sao_Paulo`). */
  timeZone: text("time_zone").notNull().default("America/Sao_Paulo"),
  updatedAt: updatedAt(),
});

/**
 * Modelo de mensagem do WhatsApp. `stage_id` nulo = modelo padrão da
 * organização; com etapa = modelo usado para leads naquela etapa.
 */
export const messageTemplate = pgTable(
  "message_template",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    stageId: text("stage_id").references(() => pipelineStage.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    ...timestamps(),
  },
  (t) => [
    // Um modelo por etapa e um único padrão (stage_id nulo) por organização.
    // O índice da constraint também atende buscas por organization_id.
    unique("message_template_org_stage_uq").on(t.organizationId, t.stageId).nullsNotDistinct(),
  ],
);
