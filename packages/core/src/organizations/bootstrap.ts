import { type Database, member, organization } from "@hospedagens/db";
import { createDefaultPipelineStages } from "../pipeline/service";
import { randomSuffix, slugify } from "../shared/slug";

export interface BootstrapOrganizationInput {
  /** Usuário que será `owner` da nova organização. */
  userId: string;
  name: string;
}

/**
 * Cria uma organização (tenant) completa: registro, membro `owner` e etapas
 * padrão do funil. Chamado no cadastro de um novo usuário.
 */
export async function bootstrapOrganization(
  db: Database,
  input: BootstrapOrganizationInput,
): Promise<{ organizationId: string; slug: string }> {
  const organizationId = crypto.randomUUID();
  const slug = `${slugify(input.name, 40) || "hospedagem"}-${randomSuffix()}`;

  await db.transaction(async (tx) => {
    await tx.insert(organization).values({ id: organizationId, name: input.name, slug });
    await tx.insert(member).values({
      id: crypto.randomUUID(),
      organizationId,
      userId: input.userId,
      role: "owner",
    });
    await createDefaultPipelineStages(tx, organizationId);
  });

  return { organizationId, slug };
}

/** Nome sugerido para a organização criada no cadastro. */
export function defaultOrganizationName(userName: string): string {
  const firstName = userName.trim().split(/\s+/)[0];
  return firstName ? `Hospedagens de ${firstName}` : "Minhas Hospedagens";
}
