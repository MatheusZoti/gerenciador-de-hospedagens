import { type Database, user } from "@hospedagens/db";
import type { TenantContext } from "./context";
import { bootstrapOrganization } from "./organizations/bootstrap";

/** Cria usuário + organização (com funil padrão) e devolve o contexto do tenant. */
export async function createTenant(db: Database, name: string): Promise<TenantContext> {
  const userId = crypto.randomUUID();
  await db.insert(user).values({ id: userId, name, email: `${userId}@teste.dev` });
  const { organizationId } = await bootstrapOrganization(db, { userId, name: `Org ${name}` });
  return { organizationId, userId, role: "owner" };
}
