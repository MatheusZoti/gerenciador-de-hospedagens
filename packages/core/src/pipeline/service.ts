import { type Database, lead, pipelineStage } from "@hospedagens/db";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import type { TenantContext } from "../context";
import { DEFAULT_PIPELINE_STAGES, type StageKind } from "./defaults";

export type PipelineStage = typeof pipelineStage.$inferSelect;

export interface FunnelStageSummary {
  id: string;
  name: string;
  color: string;
  kind: StageKind;
  position: number;
  leadCount: number;
}

/** Cria as etapas padrão do funil para uma organização recém-criada. */
export async function createDefaultPipelineStages(db: Database, organizationId: string) {
  await db.insert(pipelineStage).values(
    DEFAULT_PIPELINE_STAGES.map((stage, position) => ({
      organizationId,
      name: stage.name,
      color: stage.color,
      kind: stage.kind,
      position,
    })),
  );
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
