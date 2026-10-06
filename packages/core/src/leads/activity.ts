import { type Database, leadActivity } from "@hospedagens/db";
import type { TenantContext } from "../context";

export type LeadActivityType = (typeof leadActivity.$inferSelect)["type"];

/** Registra um evento na linha do tempo do lead (uso interno dos serviços). */
export async function recordLeadActivity(
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
