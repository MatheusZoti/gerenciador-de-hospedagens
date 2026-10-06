import "server-only";
import {
  canManageOrganization,
  DEFAULT_TIME_ZONE,
  type MemberRole,
  type TenantContext,
} from "@hospedagens/core";
import { getDb, member, organization, organizationSettings } from "@hospedagens/db";
import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export interface AppSession {
  ctx: TenantContext;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    jobTitle?: string | null;
  };
  organization: { id: string; name: string; slug: string; timeZone: string };
  /** Pode alterar configurações, funil e modelos (owner/admin). */
  canManage: boolean;
}

/**
 * Sessão + contexto de tenant para Server Components e Server Actions.
 * Redireciona para o login sem sessão. A organização vem SEMPRE da sessão e
 * da tabela de membros — nunca de parâmetros enviados pelo cliente.
 */
export const requireAppSession = cache(async (): Promise<AppSession> => {
  const current = await getSession();
  if (!current) redirect("/login");

  const membership = await findMembership(
    current.user.id,
    current.session.activeOrganizationId ?? undefined,
  );
  if (!membership) {
    throw new Error("Usuário sem organização. Rode o seed ou crie uma nova conta.");
  }

  const ctx: TenantContext = {
    organizationId: membership.organizationId,
    userId: current.user.id,
    role: membership.role as MemberRole,
  };
  return {
    ctx,
    user: current.user,
    organization: {
      id: membership.organizationId,
      name: membership.organizationName,
      slug: membership.organizationSlug,
      timeZone: membership.timeZone ?? DEFAULT_TIME_ZONE,
    },
    canManage: canManageOrganization(ctx),
  };
});

async function findMembership(userId: string, activeOrganizationId?: string) {
  const db = getDb();
  const query = (organizationId?: string) =>
    db
      .select({
        organizationId: member.organizationId,
        role: member.role,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        timeZone: organizationSettings.timeZone,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .leftJoin(
        organizationSettings,
        eq(organizationSettings.organizationId, member.organizationId),
      )
      .where(
        organizationId
          ? and(eq(member.userId, userId), eq(member.organizationId, organizationId))
          : eq(member.userId, userId),
      )
      .orderBy(asc(member.createdAt))
      .limit(1);

  if (activeOrganizationId) {
    const [active] = await query(activeOrganizationId);
    if (active) return active;
  }
  const [first] = await query();
  return first;
}
