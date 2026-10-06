import { type Database, messageTemplate, pipelineStage } from "@hospedagens/db";
import { and, eq, isNull } from "drizzle-orm";
import { assertCanManageOrganization, type TenantContext } from "../context";
import { NotFoundError, ValidationError } from "../shared/errors";
import { z } from "../shared/zod";
import {
  DEFAULT_TEMPLATE_BODY,
  type MessageTemplates,
  TEMPLATE_MAX_LENGTH,
  unknownTemplateVariables,
} from "./templates";

export const saveMessageTemplateSchema = z.object({
  /** `null` = modelo padrão da organização. */
  stageId: z.string().min(1).nullable(),
  body: z.string().trim().max(TEMPLATE_MAX_LENGTH),
});

export type SaveMessageTemplateInput = z.input<typeof saveMessageTemplateSchema>;

/** Modelos da organização: padrão + personalizados por etapa. */
export async function getMessageTemplates(
  db: Database,
  ctx: TenantContext,
): Promise<MessageTemplates> {
  const rows = await db
    .select({ stageId: messageTemplate.stageId, body: messageTemplate.body })
    .from(messageTemplate)
    .where(eq(messageTemplate.organizationId, ctx.organizationId));

  const templates: MessageTemplates = { defaultBody: DEFAULT_TEMPLATE_BODY, byStage: {} };
  for (const row of rows) {
    if (row.stageId === null) templates.defaultBody = row.body;
    else templates.byStage[row.stageId] = row.body;
  }
  return templates;
}

/**
 * Salva um modelo. Texto vazio numa etapa remove o modelo dela (volta a usar
 * o padrão); o modelo padrão não pode ficar vazio.
 */
export async function saveMessageTemplate(
  db: Database,
  ctx: TenantContext,
  input: SaveMessageTemplateInput,
): Promise<void> {
  assertCanManageOrganization(ctx);
  const { stageId, body } = saveMessageTemplateSchema.parse(input);

  if (stageId) {
    const [stage] = await db
      .select({ id: pipelineStage.id })
      .from(pipelineStage)
      .where(
        and(eq(pipelineStage.id, stageId), eq(pipelineStage.organizationId, ctx.organizationId)),
      );
    if (!stage) throw new NotFoundError("Etapa do funil");
  }

  const unknown = unknownTemplateVariables(body);
  if (unknown.length > 0) {
    throw new ValidationError(
      `Variável desconhecida: ${unknown.map((key) => `{${key}}`).join(", ")}`,
    );
  }

  const sameTemplate = and(
    eq(messageTemplate.organizationId, ctx.organizationId),
    stageId ? eq(messageTemplate.stageId, stageId) : isNull(messageTemplate.stageId),
  );

  if (!body) {
    if (!stageId) throw new ValidationError("O modelo padrão não pode ficar vazio");
    await db.delete(messageTemplate).where(sameTemplate);
    return;
  }

  await db
    .insert(messageTemplate)
    .values({ organizationId: ctx.organizationId, stageId, body })
    .onConflictDoUpdate({
      target: [messageTemplate.organizationId, messageTemplate.stageId],
      set: { body, updatedAt: new Date() },
    });
}
