import type { Database } from "@hospedagens/db";
import { createTestDb } from "@hospedagens/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantContext } from "../context";
import { listStages, type PipelineStage } from "../pipeline/service";
import { ForbiddenError, NotFoundError, ValidationError } from "../shared/errors";
import { createTenant } from "../test-utils";
import { getMessageTemplates, saveMessageTemplate } from "./template-service";
import { DEFAULT_TEMPLATE_BODY, pickTemplate } from "./templates";

describe("modelos de mensagem", () => {
  let db: Database;
  let close: () => Promise<void>;
  let ctxA: TenantContext;
  let ctxB: TenantContext;
  let stagesA: PipelineStage[];

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    ctxA = await createTenant(db, "Ana");
    ctxB = await createTenant(db, "Bruno");
    stagesA = await listStages(db, ctxA);
  });

  afterAll(async () => {
    await close();
  });

  it("organização nova vem com o padrão e os modelos sugeridos (menos 'Perdido')", async () => {
    const templates = await getMessageTemplates(db, ctxA);
    expect(templates.defaultBody).toBe(DEFAULT_TEMPLATE_BODY);
    const withTemplate = stagesA.filter((stage) => templates.byStage[stage.id]);
    expect(withTemplate.map((stage) => stage.name)).toEqual([
      "Novo lead",
      "Em conversa",
      "Pronto para fechar",
      "Aguardando pagamento",
      "Fechado",
    ]);
    const perdido = stagesA.at(-1)?.id ?? "";
    expect(pickTemplate(templates, perdido)).toBe(DEFAULT_TEMPLATE_BODY);
  });

  it("salva, atualiza e limpa o modelo de uma etapa", async () => {
    const stageId = stagesA[1]?.id ?? "";
    await saveMessageTemplate(db, ctxA, { stageId, body: "Primeira versão {nome}" });
    await saveMessageTemplate(db, ctxA, { stageId, body: "  Segunda versão {nome}  " });
    expect((await getMessageTemplates(db, ctxA)).byStage[stageId]).toBe("Segunda versão {nome}");

    await saveMessageTemplate(db, ctxA, { stageId, body: "" });
    const templates = await getMessageTemplates(db, ctxA);
    expect(templates.byStage[stageId]).toBeUndefined();
    expect(pickTemplate(templates, stageId)).toBe(templates.defaultBody);
  });

  it("atualiza o padrão sem duplicar e não aceita padrão vazio", async () => {
    await saveMessageTemplate(db, ctxA, { stageId: null, body: "Novo padrão, {primeiro_nome}" });
    await saveMessageTemplate(db, ctxA, { stageId: null, body: "Padrão final, {primeiro_nome}" });
    expect((await getMessageTemplates(db, ctxA)).defaultBody).toBe("Padrão final, {primeiro_nome}");
    await expect(saveMessageTemplate(db, ctxA, { stageId: null, body: " " })).rejects.toThrow(
      "não pode ficar vazio",
    );
  });

  it("recusa variáveis desconhecidas", async () => {
    await expect(
      saveMessageTemplate(db, ctxA, { stageId: null, body: "Oi {nomee}, pix {pix}" }),
    ).rejects.toThrow(new ValidationError("Variável desconhecida: {nomee}, {pix}"));
  });

  it("não lê nem grava modelos de outra organização", async () => {
    const stageOfA = stagesA[0]?.id ?? "";
    await expect(
      saveMessageTemplate(db, ctxB, { stageId: stageOfA, body: "invasão" }),
    ).rejects.toThrow(NotFoundError);
    expect((await getMessageTemplates(db, ctxB)).defaultBody).toBe(DEFAULT_TEMPLATE_BODY);
    expect((await getMessageTemplates(db, ctxA)).byStage[stageOfA]).not.toBe("invasão");
  });

  it("só owner/admin podem salvar", async () => {
    await expect(
      saveMessageTemplate(db, { ...ctxA, role: "member" }, { stageId: null, body: "x" }),
    ).rejects.toThrow(ForbiddenError);
  });
});
