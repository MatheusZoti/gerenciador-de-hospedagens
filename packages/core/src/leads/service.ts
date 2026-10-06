import { type Database, lead, leadActivity, pipelineStage, property, user } from "@hospedagens/db";
import { and, asc, count, desc, eq, ilike, inArray, max, ne, or, type SQL, sql } from "drizzle-orm";
import type { TenantContext } from "../context";
import { normalizePhone } from "../messaging/phone";
import type { StageKind } from "../pipeline/defaults";
import { listStages, type PipelineStage } from "../pipeline/service";
import { assertPropertyInTenant } from "../properties/service";
import { NotFoundError, ValidationError } from "../shared/errors";
import {
  type CreateLeadInput,
  createLeadSchema,
  DATES_OUT_OF_ORDER,
  datesInOrder,
  type LeadFilters,
  leadFiltersSchema,
  leadNoteSchema,
  type MoveLeadInput,
  moveLeadSchema,
  type UpdateLeadInput,
  updateLeadSchema,
} from "./schemas";

export type Lead = typeof lead.$inferSelect;
export type LeadActivityType = (typeof leadActivity.$inferSelect)["type"];

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

export interface LeadListItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: Lead["source"];
  stageId: string;
  stageName: string;
  stageColor: string;
  propertyName: string | null;
  lastMessageAt: Date | null;
  desiredCheckIn: string | null;
  desiredCheckOut: string | null;
  createdAt: Date;
}

export interface LeadDetail extends Lead {
  stageName: string;
  stageColor: string;
  stageKind: StageKind;
  propertyName: string | null;
}

export interface LeadActivityItem {
  id: string;
  type: LeadActivityType;
  payload: Record<string, unknown>;
  actorName: string | null;
  createdAt: Date;
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
    .leftJoin(property, propertyOfLead(ctx))
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

/** Lista paginada para a tela de Leads, com busca e filtros. */
export async function listLeads(
  db: Database,
  ctx: TenantContext,
  input: LeadFilters = {},
): Promise<{ rows: LeadListItem[]; total: number; page: number; pageSize: number }> {
  const filters = leadFiltersSchema.parse(input);
  const where: SQL[] = [eq(lead.organizationId, ctx.organizationId)];
  if (filters.stageId) where.push(eq(lead.stageId, filters.stageId));
  if (filters.source) where.push(eq(lead.source, filters.source));
  if (filters.propertyId) where.push(eq(lead.propertyOfInterestId, filters.propertyId));
  if (filters.search) {
    const term = `%${escapeLike(filters.search)}%`;
    const matches = [ilike(lead.name, term), ilike(lead.email, term)];
    const digits = filters.search.replace(/\D/g, "");
    if (digits.length >= 3) matches.push(ilike(lead.phone, `%${digits}%`));
    const search = or(...matches);
    if (search) where.push(search);
  }

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source,
        stageId: lead.stageId,
        stageName: pipelineStage.name,
        stageColor: pipelineStage.color,
        propertyName: property.name,
        lastMessageAt: lead.lastMessageAt,
        desiredCheckIn: lead.desiredCheckIn,
        desiredCheckOut: lead.desiredCheckOut,
        createdAt: lead.createdAt,
      })
      .from(lead)
      .innerJoin(pipelineStage, stageOfLead(ctx))
      .leftJoin(property, propertyOfLead(ctx))
      .where(and(...where))
      .orderBy(sql`${lead.lastMessageAt} desc nulls last`, desc(lead.createdAt))
      .limit(filters.pageSize)
      .offset((filters.page - 1) * filters.pageSize),
    db
      .select({ value: count() })
      .from(lead)
      .where(and(...where)),
  ]);

  return { rows, total: totalRow?.value ?? 0, page: filters.page, pageSize: filters.pageSize };
}

export async function getLead(db: Database, ctx: TenantContext, leadId: string) {
  const [found] = await db
    .select({
      lead,
      stageName: pipelineStage.name,
      stageColor: pipelineStage.color,
      stageKind: pipelineStage.kind,
      propertyName: property.name,
    })
    .from(lead)
    .innerJoin(pipelineStage, stageOfLead(ctx))
    .leftJoin(property, propertyOfLead(ctx))
    .where(and(eq(lead.id, leadId), eq(lead.organizationId, ctx.organizationId)));
  if (!found) throw new NotFoundError("Lead");

  const detail: LeadDetail = {
    ...found.lead,
    stageName: found.stageName,
    stageColor: found.stageColor,
    stageKind: found.stageKind,
    propertyName: found.propertyName,
  };
  return detail;
}

export async function createLead(
  db: Database,
  ctx: TenantContext,
  input: CreateLeadInput,
): Promise<Lead> {
  const data = createLeadSchema.parse(input);

  return db.transaction(async (tx) => {
    const stage = await resolveStage(tx, ctx, data.stageId);
    if (data.propertyOfInterestId) {
      await assertPropertyInTenant(tx, ctx, data.propertyOfInterestId);
    }

    const [top] = await tx
      .select({ value: max(lead.boardPosition) })
      .from(lead)
      .where(and(eq(lead.organizationId, ctx.organizationId), eq(lead.stageId, stage.id)));

    const [created] = await tx
      .insert(lead)
      .values({
        ...data,
        phone: data.phone ? normalizePhone(data.phone) : null,
        organizationId: ctx.organizationId,
        stageId: stage.id,
        boardPosition: (top?.value ?? -1) + 1,
        ownerUserId: ctx.userId,
      })
      .returning();
    if (!created) throw new Error("Falha ao criar lead");

    await recordActivity(tx, ctx, created.id, "created", {
      stageId: stage.id,
      stageName: stage.name,
      source: created.source,
    });

    return created;
  });
}

/**
 * Atualiza os campos enviados. Trocar `stageId` move o lead para o topo da
 * nova etapa e registra a mudança na linha do tempo.
 */
export async function updateLead(
  db: Database,
  ctx: TenantContext,
  leadId: string,
  input: UpdateLeadInput,
): Promise<Lead> {
  const { stageId, phone, ...fields } = updateLeadSchema.parse(input);

  return db.transaction(async (tx) => {
    const current = await findLead(tx, ctx, leadId);

    const checkIn =
      fields.desiredCheckIn !== undefined ? fields.desiredCheckIn : current.desiredCheckIn;
    const checkOut =
      fields.desiredCheckOut !== undefined ? fields.desiredCheckOut : current.desiredCheckOut;
    if (!datesInOrder(checkIn, checkOut)) throw new ValidationError(DATES_OUT_OF_ORDER);

    if (fields.propertyOfInterestId) {
      await assertPropertyInTenant(tx, ctx, fields.propertyOfInterestId);
    }

    const patch = {
      ...fields,
      ...(phone !== undefined && { phone: phone ? normalizePhone(phone) : null }),
    };
    if (Object.values(patch).some((value) => value !== undefined)) {
      await tx.update(lead).set(patch).where(leadInTenant(ctx, leadId));
    }

    if (stageId && stageId !== current.stageId) {
      await moveLeadInTx(tx, ctx, { leadId, toStageId: stageId, toIndex: 0 });
    }

    return findLead(tx, ctx, leadId);
  });
}

/** Move o lead para uma etapa e posição do Kanban (arrastar e soltar). */
export async function moveLead(db: Database, ctx: TenantContext, input: MoveLeadInput) {
  const data = moveLeadSchema.parse(input);
  await db.transaction((tx) => moveLeadInTx(tx, ctx, data));
}

export async function deleteLead(db: Database, ctx: TenantContext, leadId: string) {
  const deleted = await db.delete(lead).where(leadInTenant(ctx, leadId)).returning({ id: lead.id });
  if (deleted.length === 0) throw new NotFoundError("Lead");
}

export async function addLeadNote(
  db: Database,
  ctx: TenantContext,
  leadId: string,
  input: { text: string },
) {
  const { text } = leadNoteSchema.parse(input);
  await findLead(db, ctx, leadId);
  await recordActivity(db, ctx, leadId, "note", { text });
}

/**
 * Registra que houve conversa agora: atualiza "última mensagem" no Kanban.
 * Na fase 4 (WhatsApp oficial) isso passa a ser automático.
 */
export async function logLeadMessage(db: Database, ctx: TenantContext, leadId: string) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(lead)
      .set({ lastMessageAt: new Date() })
      .where(leadInTenant(ctx, leadId))
      .returning({ id: lead.id });
    if (updated.length === 0) throw new NotFoundError("Lead");
    await recordActivity(tx, ctx, leadId, "message", {});
  });
}

export async function listLeadActivities(
  db: Database,
  ctx: TenantContext,
  leadId: string,
): Promise<LeadActivityItem[]> {
  return db
    .select({
      id: leadActivity.id,
      type: leadActivity.type,
      payload: leadActivity.payload,
      actorName: user.name,
      createdAt: leadActivity.createdAt,
    })
    .from(leadActivity)
    .leftJoin(user, eq(user.id, leadActivity.actorUserId))
    .where(
      and(eq(leadActivity.organizationId, ctx.organizationId), eq(leadActivity.leadId, leadId)),
    )
    .orderBy(desc(leadActivity.createdAt));
}

async function moveLeadInTx(
  tx: Database,
  ctx: TenantContext,
  { leadId, toStageId, toIndex }: { leadId: string; toStageId: string; toIndex: number },
) {
  const current = await findLead(tx, ctx, leadId);
  const target = await resolveStage(tx, ctx, toStageId);

  const column = await tx
    .select({ id: lead.id, boardPosition: lead.boardPosition })
    .from(lead)
    .where(
      and(
        eq(lead.organizationId, ctx.organizationId),
        eq(lead.stageId, target.id),
        ne(lead.id, leadId),
      ),
    )
    .orderBy(desc(lead.boardPosition), desc(lead.createdAt));

  // Reinsere o lead na posição pedida e renumera a coluna (topo = maior posição).
  const order = column.map((row) => row.id);
  order.splice(Math.min(toIndex, order.length), 0, leadId);
  const previous = new Map(column.map((row) => [row.id, row.boardPosition]));

  for (const [index, id] of order.entries()) {
    const boardPosition = order.length - 1 - index;
    if (id === leadId) {
      await tx.update(lead).set({ stageId: target.id, boardPosition }).where(leadInTenant(ctx, id));
    } else if (previous.get(id) !== boardPosition) {
      await tx.update(lead).set({ boardPosition }).where(leadInTenant(ctx, id));
    }
  }

  if (current.stageId !== target.id) {
    const [from] = await tx
      .select({ name: pipelineStage.name })
      .from(pipelineStage)
      .where(eq(pipelineStage.id, current.stageId));
    await recordActivity(tx, ctx, leadId, "stage_changed", {
      fromStageId: current.stageId,
      fromStageName: from?.name ?? null,
      toStageId: target.id,
      toStageName: target.name,
    });
  }
}

async function findLead(db: Database, ctx: TenantContext, leadId: string): Promise<Lead> {
  const [found] = await db.select().from(lead).where(leadInTenant(ctx, leadId));
  if (!found) throw new NotFoundError("Lead");
  return found;
}

/** Etapa informada (validada no tenant) ou, sem ela, a primeira etapa aberta. */
async function resolveStage(db: Database, ctx: TenantContext, stageId?: string) {
  const filters = [eq(pipelineStage.organizationId, ctx.organizationId)];
  if (stageId) filters.push(eq(pipelineStage.id, stageId));
  else filters.push(eq(pipelineStage.kind, "open"));

  const [stage] = await db
    .select({ id: pipelineStage.id, name: pipelineStage.name })
    .from(pipelineStage)
    .where(and(...filters))
    .orderBy(asc(pipelineStage.position))
    .limit(1);

  if (!stage) {
    throw stageId
      ? new NotFoundError("Etapa do funil")
      : new ValidationError("A organização não tem etapas abertas no funil");
  }
  return stage;
}

async function recordActivity(
  db: Database,
  ctx: TenantContext,
  leadId: string,
  type: LeadActivityType,
  payload: Record<string, unknown>,
) {
  await db.insert(leadActivity).values({
    organizationId: ctx.organizationId,
    leadId,
    actorUserId: ctx.userId,
    type,
    payload,
  });
}

const leadInTenant = (ctx: TenantContext, leadId: string) =>
  and(eq(lead.id, leadId), eq(lead.organizationId, ctx.organizationId));

const stageOfLead = (ctx: TenantContext) =>
  and(eq(pipelineStage.id, lead.stageId), eq(pipelineStage.organizationId, ctx.organizationId));

const propertyOfLead = (ctx: TenantContext) =>
  and(eq(property.id, lead.propertyOfInterestId), eq(property.organizationId, ctx.organizationId));

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
