import { type Database, user } from "@hospedagens/db";
import { createTestDb } from "@hospedagens/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantContext } from "./context";
import { createLead, listLeadsByStage } from "./leads/service";
import { bootstrapOrganization } from "./organizations/bootstrap";
import { DEFAULT_PIPELINE_STAGES } from "./pipeline/defaults";
import { getFunnelSummary, listStages } from "./pipeline/service";
import { createProperty, listProperties } from "./properties/service";
import { NotFoundError } from "./shared/errors";

/**
 * Garante o isolamento entre organizações (tenants): nada criado em uma
 * organização pode ser lido ou referenciado a partir de outra.
 */
describe("multi-tenancy", () => {
  let db: Database;
  let close: () => Promise<void>;
  let ctxA: TenantContext;
  let ctxB: TenantContext;

  async function createTenant(name: string): Promise<TenantContext> {
    const userId = crypto.randomUUID();
    await db.insert(user).values({ id: userId, name, email: `${userId}@teste.dev` });
    const { organizationId } = await bootstrapOrganization(db, { userId, name: `Org ${name}` });
    return { organizationId, userId, role: "owner" };
  }

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    ctxA = await createTenant("Ana");
    ctxB = await createTenant("Bruno");
  });

  afterAll(async () => {
    await close();
  });

  it("cria as etapas padrão do funil na ordem para cada organização", async () => {
    const stages = await listStages(db, ctxA);
    expect(stages.map((stage) => stage.name)).toEqual(
      DEFAULT_PIPELINE_STAGES.map((stage) => stage.name),
    );
    expect(stages.every((stage) => stage.organizationId === ctxA.organizationId)).toBe(true);
  });

  it("lista apenas os leads e imóveis da própria organização", async () => {
    const casa = await createProperty(db, ctxA, { name: "Casa Pé na Areia" });
    await createLead(db, ctxA, { name: "Lead da A", propertyOfInterestId: casa.id });
    await createLead(db, ctxB, { name: "Lead da B" });

    const boardA = await listLeadsByStage(db, ctxA);
    const boardB = await listLeadsByStage(db, ctxB);
    const namesA = boardA.flatMap((column) => column.leads.map((lead) => lead.name));
    const namesB = boardB.flatMap((column) => column.leads.map((lead) => lead.name));

    expect(namesA).toEqual(["Lead da A"]);
    expect(namesB).toEqual(["Lead da B"]);
    expect(boardA[0]?.leads[0]?.propertyName).toBe("Casa Pé na Areia");
    expect(await listProperties(db, ctxB)).toEqual([]);
  });

  it("recusa etapa ou imóvel de outra organização", async () => {
    const [stageFromA] = await listStages(db, ctxA);
    const [propertyFromA] = await listProperties(db, ctxA);

    await expect(
      createLead(db, ctxB, { name: "Invasor", stageId: stageFromA?.id }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      createLead(db, ctxB, { name: "Invasor", propertyOfInterestId: propertyFromA?.id }),
    ).rejects.toThrow(NotFoundError);
  });

  it("conta leads por etapa no resumo do funil sem misturar organizações", async () => {
    const stages = await listStages(db, ctxA);
    const emConversa = stages[1];
    await createLead(db, ctxA, { name: "Em conversa 1", stageId: emConversa?.id });
    await createLead(db, ctxA, { name: "Em conversa 2", stageId: emConversa?.id });

    const summaryA = await getFunnelSummary(db, ctxA);
    const summaryB = await getFunnelSummary(db, ctxB);

    expect(summaryA.map((stage) => stage.leadCount)).toEqual([1, 2, 0, 0, 0, 0]);
    expect(summaryB.map((stage) => stage.leadCount)).toEqual([1, 0, 0, 0, 0, 0]);
  });

  it("coloca leads novos no topo da coluna e respeita limitPerStage", async () => {
    const [, emConversa] = await listStages(db, ctxA);
    const [column] = await listLeadsByStage(db, ctxA, { kinds: ["open"], limitPerStage: 1 });
    const columnEmConversa = (await listLeadsByStage(db, ctxA)).find(
      (col) => col.stage.id === emConversa?.id,
    );

    expect(column?.leads).toHaveLength(1);
    expect(columnEmConversa?.leads.map((lead) => lead.name)).toEqual([
      "Em conversa 2",
      "Em conversa 1",
    ]);
    expect(columnEmConversa?.total).toBe(2);
  });

  it("normaliza o telefone e valida as datas desejadas", async () => {
    const lead = await createLead(db, ctxA, { name: "Carla", phone: "(11) 98765-4321" });
    expect(lead.phone).toBe("5511987654321");

    await expect(
      createLead(db, ctxA, {
        name: "Datas trocadas",
        desiredCheckIn: "2026-12-20",
        desiredCheckOut: "2026-12-18",
      }),
    ).rejects.toThrow("Check-out deve ser depois do check-in");
  });
});
