import { type Database, organization, organizationSettings } from "@hospedagens/db";
import { eq } from "drizzle-orm";
import { assertCanManageOrganization, type TenantContext } from "../context";
import { NotFoundError } from "../shared/errors";
import { z } from "../shared/zod";

export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da organização").max(80),
  timeZone: z.string().refine(isValidTimeZone, "Fuso horário inválido"),
});

export type OrganizationSettingsInput = z.input<typeof organizationSettingsSchema>;

export interface OrganizationSettings {
  name: string;
  timeZone: string;
}

export async function getOrganizationSettings(
  db: Database,
  ctx: TenantContext,
): Promise<OrganizationSettings> {
  const [row] = await db
    .select({ name: organization.name, timeZone: organizationSettings.timeZone })
    .from(organization)
    .leftJoin(organizationSettings, eq(organizationSettings.organizationId, organization.id))
    .where(eq(organization.id, ctx.organizationId));
  if (!row) throw new NotFoundError("Organização");
  return { name: row.name, timeZone: row.timeZone ?? DEFAULT_TIME_ZONE };
}

export async function updateOrganizationSettings(
  db: Database,
  ctx: TenantContext,
  input: OrganizationSettingsInput,
): Promise<OrganizationSettings> {
  assertCanManageOrganization(ctx);
  const data = organizationSettingsSchema.parse(input);

  await db.transaction(async (tx) => {
    await tx
      .update(organization)
      .set({ name: data.name })
      .where(eq(organization.id, ctx.organizationId));
    await tx
      .insert(organizationSettings)
      .values({ organizationId: ctx.organizationId, timeZone: data.timeZone })
      .onConflictDoUpdate({
        target: organizationSettings.organizationId,
        set: { timeZone: data.timeZone, updatedAt: new Date() },
      });
  });

  return data;
}
