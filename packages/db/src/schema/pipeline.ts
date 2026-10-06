import { index, integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { organization } from "./auth";

/** `open` = etapa em andamento; `won`/`lost` = etapas finais do funil. */
export const stageKind = pgEnum("stage_kind", ["open", "won", "lost"]);

/** Etapa do funil de vendas — configurável por organização. */
export const pipelineStage = pgTable(
  "pipeline_stage",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    /** Chave de cor da paleta do app (ex.: `sky`, `amber`). */
    color: text("color").notNull().default("slate"),
    kind: stageKind("kind").notNull().default("open"),
    ...timestamps(),
  },
  (t) => [index("pipeline_stage_org_position_idx").on(t.organizationId, t.position)],
);
