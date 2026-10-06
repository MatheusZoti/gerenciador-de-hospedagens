import { type Database, member, messageTemplate, organization } from "@hospedagens/db";
import { DEFAULT_TEMPLATE_BODY } from "../messaging/templates";
import { DEFAULT_PIPELINE_STAGES } from "../pipeline/defaults";
import { createDefaultPipelineStages } from "../pipeline/service";
import { randomSuffix, slugify } from "../shared/slug";

export interface BootstrapOrganizationInput {
  /** Usuário que será `owner` da nova organização. */
  userId: string;
  name: string;
}

/**
 * Cria uma organização (tenant) completa: registro, membro `owner`, etapas
 * padrão do funil e modelos de mensagem sugeridos. Chamado no cadastro.
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
    const stages = await createDefaultPipelineStages(tx, organizationId);
    await createDefaultMessageTemplates(tx, organizationId, stages);
  });

  return { organizationId, slug };
}

/** Nome sugerido para a organização criada no cadastro. */
export function defaultOrganizationName(userName: string): string {
  const firstName = userName.trim().split(/\s+/)[0];
  return firstName ? `Hospedagens de ${firstName}` : "Minhas Hospedagens";
}

/** Modelo padrão + modelos sugeridos para as etapas que vêm com o funil. */
export async function createDefaultMessageTemplates(
  db: Database,
  organizationId: string,
  stages: { id: string; name: string }[],
) {
  const suggested = new Map(
    DEFAULT_PIPELINE_STAGES.map((stage) => [stage.name, stage.messageTemplate]),
  );
  const rows = [
    { organizationId, stageId: null, body: DEFAULT_TEMPLATE_BODY },
    ...stages.flatMap((stage) => {
      const body = suggested.get(stage.name);
      return body ? [{ organizationId, stageId: stage.id, body }] : [];
    }),
  ];
  await db.insert(messageTemplate).values(rows);
}
