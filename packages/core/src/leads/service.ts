import { type Database, lead, leadActivity, pipelineStage, property } from "@hospedagens/db";
import { and, asc, desc, eq, inArray, max } from "drizzle-orm";
import type { TenantContext } from "../context";
import { normalizePhone } from "../messaging/phone";
import type { StageKind } from "../pipeline/defaults";
import { listStages, type PipelineStage } from "../pipeline/service";
import { NotFoundError, ValidationError } from "../shared/errors";
import { type CreateLeadInput, createLeadSchema } from "./schemas";

export type Lead = typeof lead.$inferSelect;

/** Dados de um card do Kanban. */
export interface BoardLead {
  id: string;
  name: string;
  phone: string | null;
  stageId: string;
  propertyName: string | null;
  lastMessageAt: Date | null;
  desiredCheckIn: string | null;
  desiredCheckOut: string | null;
  guests: number | null;
}

export interface BoardColumn {
  stage: PipelineStage;
  leads: BoardLead[];
  /** Total de leads na etapa (pode ser maior que `leads.length` com `limitPerStage`). */
  total: number;
}

/**
 * Leads agrupados por etapa do funil, na ordem do Kanban
 * (maior `boardPosition` primeiro).
 */
export async function listLeadsByStage(
  db: Database,
  ctx: TenantContext,
  opts: { kinds?: StageKind[]; limitPerStage?: number } = {},
): Promise<BoardColumn[]> {
  const stages = await listStages(db, ctx, { kinds: opts.kinds });
  if (stages.length === 0) return [];

  const rows = await db
    .select({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      stageId: lead.stageId,
      propertyName: property.name,
      lastMessageAt: lead.lastMessageAt,
      desiredCheckIn: lead.desiredCheckIn,
      desiredCheckOut: lead.desiredCheckOut,
      guests: lead.guests,
    })
    .from(lead)
    .leftJoin(
      property,
      and(
        eq(property.id, lead.propertyOfInterestId),
        eq(property.organizationId, ctx.organizationId),
      ),
    )
    .where(
      and(
        eq(lead.organizationId, ctx.organizationId),
        inArray(
          lead.stageId,
          stages.map((stage) => stage.id),
        ),
      ),
    )
    .orderBy(desc(lead.boardPosition), desc(lead.createdAt));

  const columns = new Map<string, BoardColumn>(
    stages.map((stage) => [stage.id, { stage, leads: [], total: 0 }]),
  );
  for (const row of rows) {
    const column = columns.get(row.stageId);
    if (!column) continue;
    column.total++;
    if (opts.limitPerStage === undefined || column.leads.length < opts.limitPerStage) {
      column.leads.push(row);
    }
  }
  return [...columns.values()];
}

export async function createLead(
  db: Database,
  ctx: TenantContext,
  input: CreateLeadInput,
): Promise<Lead> {
  const data = createLeadSchema.parse(input);

  return db.transaction(async (tx) => {
    const stageId = await resolveStageId(tx, ctx, data.stageId);

    if (data.propertyOfInterestId) {
      const [owned] = await tx
        .select({ id: property.id })
        .from(property)
        .where(
          and(
            eq(property.id, data.propertyOfInterestId),
            eq(property.organizationId, ctx.organizationId),
          ),
        );
      if (!owned) throw new NotFoundError("Imóvel");
    }

    const [top] = await tx
      .select({ value: max(lead.boardPosition) })
      .from(lead)
      .where(and(eq(lead.organizationId, ctx.organizationId), eq(lead.stageId, stageId)));

    const [created] = await tx
      .insert(lead)
      .values({
        ...data,
        phone: data.phone ? normalizePhone(data.phone) : null,
        organizationId: ctx.organizationId,
        stageId,
        boardPosition: (top?.value ?? -1) + 1,
        ownerUserId: ctx.userId,
      })
      .returning();
    if (!created) throw new Error("Falha ao criar lead");

    await tx.insert(leadActivity).values({
      organizationId: ctx.organizationId,
      leadId: created.id,
      actorUserId: ctx.userId,
      type: "created",
      payload: { stageId, source: created.source },
    });

    return created;
  });
}

async function resolveStageId(db: Database, ctx: TenantContext, stageId?: string) {
  const filters = [eq(pipelineStage.organizationId, ctx.organizationId)];
  if (stageId) filters.push(eq(pipelineStage.id, stageId));
  else filters.push(eq(pipelineStage.kind, "open"));

  const [stage] = await db
    .select({ id: pipelineStage.id })
    .from(pipelineStage)
    .where(and(...filters))
    .orderBy(asc(pipelineStage.position))
    .limit(1);

  if (!stage) {
    throw stageId
      ? new NotFoundError("Etapa do funil")
      : new ValidationError("A organização não tem etapas abertas no funil");
  }
  return stage.id;
}
