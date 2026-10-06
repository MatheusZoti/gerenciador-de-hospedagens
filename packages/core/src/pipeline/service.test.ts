import type { Database } from "@hospedagens/db";
import { createTestDb } from "@hospedagens/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantContext } from "../context";
import { createLead, getLead, listLeadActivities, listLeadsByStage } from "../leads/service";
import { getMessageTemplates } from "../messaging/template-service";
import { ForbiddenError, NotFoundError, ValidationError } from "../shared/errors";
import { createTenant } from "../test-utils";
import {
  createStage,
  deleteStage,
  listStages,
  moveStage,
  reorderStages,
  updateStage,
} from "./service";

describe("gestão do funil", () => {
  let db: Database;
  let close: () => Promise<void>;
  let ctxA: TenantContext;
  let ctxB: TenantContext;

  const names = async (ctx: TenantContext) => (await listStages(db, ctx)).map((s) => s.name);
  const idOf = async (ctx: TenantContext, name: string) =>
    (await listStages(db, ctx)).find((stage) => stage.name === name)?.id ?? "";

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    ctxA = await createTenant(db, "Ana");
    ctxB = await createTenant(db, "Bruno");
  });

  afterAll(async () => {
    await close();
  });

  it("cria etapa aberta antes das etapas finais", async () => {
    const created = await createStage(db, ctxA, { name: "Visita agendada", color: "violet" });
    expect(created.kind).toBe("open");
    expect(await names(ctxA)).toEqual([
      "Novo lead",
      "Em conversa",
      "Pronto para fechar",
      "Aguardando pagamento",
      "Visita agendada",
      "Fechado",
      "Perdido",
    ]);
    expect((await listStages(db, ctxA)).map((s) => s.position)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("renomeia e troca a cor; valida nome e cor", async () => {
    const id = await idOf(ctxA, "Visita agendada");
    const updated = await updateStage(db, ctxA, id, { name: "Visita marcada", color: "amber" });
    expect(updated).toMatchObject({ name: "Visita marcada", color: "amber" });

    await expect(updateStage(db, ctxA, id, { name: "x" })).rejects.toThrow("Informe o nome");
    await expect(updateStage(db, ctxA, id, { color: "neon" as "sky" })).rejects.toThrow(
      "Escolha uma cor da lista",
    );
  });

  it("sobe/desce etapas abertas sem mexer nas finais", async () => {
    const id = await idOf(ctxA, "Visita marcada");
    await moveStage(db, ctxA, id, "up");
    await moveStage(db, ctxA, id, "up");
    expect((await names(ctxA)).slice(0, 5)).toEqual([
      "Novo lead",
      "Em conversa",
      "Visita marcada",
      "Pronto para fechar",
      "Aguardando pagamento",
    ]);
    const first = await idOf(ctxA, "Novo lead");
    await moveStage(db, ctxA, first, "up"); // já é a primeira: nada muda
    expect((await names(ctxA))[0]).toBe("Novo lead");
    expect((await names(ctxA)).slice(-2)).toEqual(["Fechado", "Perdido"]);
  });

  it("reordena só com o conjunto exato de etapas abertas", async () => {
    const open = await listStages(db, ctxA, { kinds: ["open"] });
    const reversed = open.map((stage) => stage.id).reverse();
    await reorderStages(db, ctxA, reversed);
    expect((await names(ctxA))[0]).toBe("Aguardando pagamento");

    const won = await idOf(ctxA, "Fechado");
    await expect(reorderStages(db, ctxA, [...reversed.slice(1), won])).rejects.toThrow(
      ValidationError,
    );
    await reorderStages(db, ctxA, reversed.reverse());
    expect((await names(ctxA))[0]).toBe("Novo lead");
  });

  it("exclui etapa vazia e também o modelo de mensagem dela", async () => {
    const extra = await createStage(db, ctxA, { name: "Temporária", color: "slate" });
    const { saveMessageTemplate } = await import("../messaging/template-service");
    await saveMessageTemplate(db, ctxA, { stageId: extra.id, body: "Oi {nome}" });

    expect(await deleteStage(db, ctxA, extra.id)).toEqual({ movedLeads: 0 });
    expect(await names(ctxA)).not.toContain("Temporária");
    expect((await getMessageTemplates(db, ctxA)).byStage[extra.id]).toBeUndefined();
    expect((await listStages(db, ctxA)).map((s) => s.position)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("exige destino para os leads e os move com registro na linha do tempo", async () => {
    const source = await idOf(ctxA, "Visita marcada");
    const target = await idOf(ctxA, "Em conversa");
    const existing = await createLead(db, ctxA, { name: "Já estava", stageId: target });
    const l1 = await createLead(db, ctxA, { name: "Visita 1", stageId: source });
    const l2 = await createLead(db, ctxA, { name: "Visita 2", stageId: source });

    await expect(deleteStage(db, ctxA, source)).rejects.toThrow("os 2 leads");
    await expect(deleteStage(db, ctxA, source, { moveLeadsTo: source })).rejects.toThrow(
      ValidationError,
    );

    expect(await deleteStage(db, ctxA, source, { moveLeadsTo: target })).toEqual({
      movedLeads: 2,
    });
    const column = (await listLeadsByStage(db, ctxA)).find((c) => c.stage.id === target);
    expect(column?.leads.map((lead) => lead.name)).toEqual(["Visita 2", "Visita 1", "Já estava"]);
    expect((await getLead(db, ctxA, l1.id)).stageName).toBe("Em conversa");
    const [activity] = await listLeadActivities(db, ctxA, l2.id);
    expect(activity).toMatchObject({
      type: "stage_changed",
      payload: {
        fromStageName: "Visita marcada",
        toStageName: "Em conversa",
        reason: "stage_deleted",
      },
    });
    expect((await getLead(db, ctxA, existing.id)).stageId).toBe(target);
  });

  it("protege etapas finais e a última etapa aberta", async () => {
    await expect(deleteStage(db, ctxA, await idOf(ctxA, "Fechado"))).rejects.toThrow(
      "etapas finais",
    );
    await expect(deleteStage(db, ctxA, await idOf(ctxA, "Perdido"))).rejects.toThrow(
      "etapas finais",
    );

    const open = await listStages(db, ctxB, { kinds: ["open"] });
    for (const stage of open.slice(1)) await deleteStage(db, ctxB, stage.id);
    await expect(deleteStage(db, ctxB, open[0]?.id ?? "")).rejects.toThrow(
      "pelo menos uma etapa aberta",
    );
  });

  it("não altera o funil de outra organização", async () => {
    const stageOfA = await idOf(ctxA, "Novo lead");
    await expect(updateStage(db, ctxB, stageOfA, { name: "Invasão" })).rejects.toThrow(
      NotFoundError,
    );
    await expect(moveStage(db, ctxB, stageOfA, "down")).rejects.toThrow(NotFoundError);
    await expect(deleteStage(db, ctxB, stageOfA)).rejects.toThrow(NotFoundError);
    const [stageOfB] = await listStages(db, ctxB);
    await expect(
      deleteStage(db, ctxA, await idOf(ctxA, "Em conversa"), { moveLeadsTo: stageOfB?.id }),
    ).rejects.toThrow(NotFoundError);
    expect(await names(ctxA)).toContain("Novo lead");
  });

  it("só owner/admin alteram o funil", async () => {
    const member: TenantContext = { ...ctxA, role: "member" };
    const id = await idOf(ctxA, "Novo lead");
    await expect(createStage(db, member, { name: "Nova", color: "sky" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(updateStage(db, member, id, { name: "Nova" })).rejects.toThrow(ForbiddenError);
    await expect(moveStage(db, member, id, "down")).rejects.toThrow(ForbiddenError);
    await expect(deleteStage(db, member, id)).rejects.toThrow(ForbiddenError);
  });
});
