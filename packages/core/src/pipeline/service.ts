import { type Database, lead, pipelineStage } from "@hospedagens/db";
import { and, asc, count, eq, inArray, max } from "drizzle-orm";
import { assertCanManageOrganization, type TenantContext } from "../context";
import { recordLeadActivity } from "../leads/activity";
import { NotFoundError, ValidationError } from "../shared/errors";
import { z } from "../shared/zod";
import { DEFAULT_PIPELINE_STAGES, STAGE_COLORS, type StageKind } from "./defaults";

export type PipelineStage = typeof pipelineStage.$inferSelect;

export interface FunnelStageSummary {
  id: string;
  name: string;
  color: string;
  kind: StageKind;
  position: number;
  leadCount: number;
}

const stageFields = {
  name: z.string().trim().min(2, "Informe o nome da etapa").max(40),
  color: z.enum(STAGE_COLORS, "Escolha uma cor da lista"),
};
export const createStageSchema = z.object(stageFields);
export const updateStageSchema = z.object(stageFields).partial();

export type CreateStageInput = z.input<typeof createStageSchema>;
export type UpdateStageInput = z.input<typeof updateStageSchema>;

/** Ordem de exibição: etapas abertas primeiro, depois "ganho" e "perdido". */
const KIND_ORDER: Record<StageKind, number> = { open: 0, won: 1, lost: 2 };

/** Cria as etapas padrão do funil para uma organização recém-criada. */
export async function createDefaultPipelineStages(
  db: Database,
  organizationId: string,
): Promise<PipelineStage[]> {
  return db
    .insert(pipelineStage)
    .values(
      DEFAULT_PIPELINE_STAGES.map((stage, position) => ({
        organizationId,
        name: stage.name,
        color: stage.color,
        kind: stage.kind,
        position,
      })),
    )
    .returning();
}

export async function listStages(
  db: Database,
  ctx: TenantContext,
  opts: { kinds?: StageKind[] } = {},
): Promise<PipelineStage[]> {
  const filters = [eq(pipelineStage.organizationId, ctx.organizationId)];
  if (opts.kinds?.length) filters.push(inArray(pipelineStage.kind, opts.kinds));

  return db
    .select()
    .from(pipelineStage)
    .where(and(...filters))
    .orderBy(asc(pipelineStage.position));
}

/** Quantidade de leads em cada etapa do funil, na ordem das etapas. */
export async function getFunnelSummary(
  db: Database,
  ctx: TenantContext,
): Promise<FunnelStageSummary[]> {
  return db
    .select({
      id: pipelineStage.id,
      name: pipelineStage.name,
      color: pipelineStage.color,
      kind: pipelineStage.kind,
      position: pipelineStage.position,
      leadCount: count(lead.id),
    })
    .from(pipelineStage)
    .leftJoin(
      lead,
      and(eq(lead.stageId, pipelineStage.id), eq(lead.organizationId, ctx.organizationId)),
    )
    .where(eq(pipelineStage.organizationId, ctx.organizationId))
    .groupBy(pipelineStage.id)
    .orderBy(asc(pipelineStage.position));
}

/** Nova etapa aberta, inserida depois das etapas abertas existentes. */
export async function createStage(
  db: Database,
  ctx: TenantContext,
  input: CreateStageInput,
): Promise<PipelineStage> {
  assertCanManageOrganization(ctx);
  const data = createStageSchema.parse(input);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(pipelineStage)
      .values({ ...data, organizationId: ctx.organizationId, kind: "open", position: 0 })
      .returning();
    if (!created) throw new Error("Falha ao criar etapa");

    const stages = await listStages(tx, ctx);
    const others = stages.filter((stage) => stage.id !== created.id);
    const open = others.filter((stage) => stage.kind === "open");
    const final = others.filter((stage) => stage.kind !== "open");
    await renumber(tx, ctx, [...open, created, ...final]);
    return { ...created, position: open.length };
  });
}

export async function updateStage(
  db: Database,
  ctx: TenantContext,
  stageId: string,
  input: UpdateStageInput,
): Promise<PipelineStage> {
  assertCanManageOrganization(ctx);
  const data = updateStageSchema.parse(input);

  const [updated] = await db
    .update(pipelineStage)
    .set(data)
    .where(stageInTenant(ctx, stageId))
    .returning();
  if (!updated) throw new NotFoundError("Etapa do funil");
  return updated;
}

/**
 * Define a ordem das etapas abertas. As etapas finais ("ganho" e "perdido")
 * ficam sempre depois delas, na ordem atual.
 */
export async function reorderStages(
  db: Database,
  ctx: TenantContext,
  openStageIds: string[],
): Promise<void> {
  assertCanManageOrganization(ctx);

  await db.transaction(async (tx) => {
    const stages = await listStages(tx, ctx);
    const open = stages.filter((stage) => stage.kind === "open");
    const sameSet =
      openStageIds.length === open.length &&
      new Set(openStageIds).size === open.length &&
      open.every((stage) => openStageIds.includes(stage.id));
    if (!sameSet) {
      throw new ValidationError(
        "A nova ordem precisa conter exatamente as etapas abertas do funil",
      );
    }

    const byId = new Map(stages.map((stage) => [stage.id, stage]));
    const ordered = openStageIds.map((id) => byId.get(id) as PipelineStage);
    const final = stages
      .filter((stage) => stage.kind !== "open")
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.position - b.position);
    await renumber(tx, ctx, [...ordered, ...final]);
  });
}

/** Sobe ou desce uma etapa aberta uma posição. */
export async function moveStage(
  db: Database,
  ctx: TenantContext,
  stageId: string,
  direction: "up" | "down",
): Promise<void> {
  const open = await listStages(db, ctx, { kinds: ["open"] });
  const index = open.findIndex((stage) => stage.id === stageId);
  if (index < 0) throw new NotFoundError("Etapa aberta do funil");

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= open.length) return;

  const ids = open.map((stage) => stage.id);
  [ids[index], ids[target]] = [ids[target] as string, ids[index] as string];
  await reorderStages(db, ctx, ids);
}

/**
 * Exclui uma etapa aberta. Se houver leads nela, eles vão para o topo da
 * etapa `moveLeadsTo`, com o registro na linha do tempo de cada um.
 */
export async function deleteStage(
  db: Database,
  ctx: TenantContext,
  stageId: string,
  opts: { moveLeadsTo?: string | null } = {},
): Promise<{ movedLeads: number }> {
  assertCanManageOrganization(ctx);

  return db.transaction(async (tx) => {
    const stages = await listStages(tx, ctx);
    const stage = stages.find((item) => item.id === stageId);
    if (!stage) throw new NotFoundError("Etapa do funil");
    if (stage.kind !== "open") {
      throw new ValidationError("As etapas finais (ganho e perdido) não podem ser excluídas");
    }
    if (stages.filter((item) => item.kind === "open").length === 1) {
      throw new ValidationError("O funil precisa ter pelo menos uma etapa aberta");
    }

    const leads = await tx
      .select({ id: lead.id })
      .from(lead)
      .where(and(eq(lead.organizationId, ctx.organizationId), eq(lead.stageId, stageId)))
      .orderBy(asc(lead.boardPosition), asc(lead.createdAt));

    if (leads.length > 0) {
      const target = stages.find((item) => item.id === opts.moveLeadsTo);
      if (!opts.moveLeadsTo || opts.moveLeadsTo === stageId) {
        throw new ValidationError(
          `Escolha para qual etapa mover ${leads.length === 1 ? "o lead" : `os ${leads.length} leads`} desta etapa`,
        );
      }
      if (!target) throw new NotFoundError("Etapa de destino");

      const [top] = await tx
        .select({ value: max(lead.boardPosition) })
        .from(lead)
        .where(and(eq(lead.organizationId, ctx.organizationId), eq(lead.stageId, target.id)));
      let position = (top?.value ?? -1) + 1;
      for (const { id } of leads) {
        await tx
          .update(lead)
          .set({ stageId: target.id, boardPosition: position++ })
          .where(and(eq(lead.id, id), eq(lead.organizationId, ctx.organizationId)));
        await recordLeadActivity(tx, ctx, id, "stage_changed", {
          fromStageId: stage.id,
          fromStageName: stage.name,
          toStageId: target.id,
          toStageName: target.name,
          reason: "stage_deleted",
        });
      }
    }

    await tx.delete(pipelineStage).where(stageInTenant(ctx, stageId));
    await renumber(
      tx,
      ctx,
      stages.filter((item) => item.id !== stageId),
    );
    return { movedLeads: leads.length };
  });
}

/** Grava `position` 0..n na ordem recebida (só o que mudou). */
async function renumber(db: Database, ctx: TenantContext, ordered: PipelineStage[]) {
  for (const [position, stage] of ordered.entries()) {
    if (stage.position === position) continue;
    await db.update(pipelineStage).set({ position }).where(stageInTenant(ctx, stage.id));
  }
}

const stageInTenant = (ctx: TenantContext, stageId: string) =>
  and(eq(pipelineStage.id, stageId), eq(pipelineStage.organizationId, ctx.organizationId));
