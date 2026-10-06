import type { Database } from "@hospedagens/db";
import { createTestDb } from "@hospedagens/db/testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { TenantContext } from "../context";
import { listStages, type PipelineStage } from "../pipeline/service";
import { createProperty } from "../properties/service";
import { NotFoundError, ValidationError } from "../shared/errors";
import { createTenant } from "../test-utils";
import {
  addLeadNote,
  createLead,
  deleteLead,
  getLead,
  listLeadActivities,
  listLeads,
  listLeadsByStage,
  logLeadMessage,
  moveLead,
  updateLead,
} from "./service";

describe("leads", () => {
  let db: Database;
  let close: () => Promise<void>;
  let ctxA: TenantContext;
  let ctxB: TenantContext;
  let stagesA: PipelineStage[];

  const stage = (index: number) => stagesA[index]?.id ?? "";
  const columnNames = async (stageId: string) =>
    (await listLeadsByStage(db, ctxA))
      .find((column) => column.stage.id === stageId)
      ?.leads.map((lead) => lead.name);

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    ctxA = await createTenant(db, "Ana");
    ctxB = await createTenant(db, "Bruno");
    stagesA = await listStages(db, ctxA);
  });

  afterAll(async () => {
    await close();
  });

  describe("listLeads", () => {
    beforeAll(async () => {
      const casa = await createProperty(db, ctxA, { name: "Casa Lista" });
      await createLead(db, ctxA, {
        name: "Beatriz Lista",
        phone: "(11) 90000-1234",
        email: "bia@exemplo.com",
        propertyOfInterestId: casa.id,
        source: "instagram",
        lastMessageAt: new Date("2026-10-01T12:00:00Z"),
      });
      await createLead(db, ctxA, {
        name: "Caio Lista",
        stageId: stage(1),
        source: "site",
        lastMessageAt: new Date("2026-10-03T12:00:00Z"),
      });
      await createLead(db, ctxA, { name: "Dora Lista 100%", source: "site" });
      await createLead(db, ctxB, { name: "Beatriz de Outra Org", phone: "(11) 90000-1234" });
    });

    const names = async (filters: Parameters<typeof listLeads>[2]) =>
      (await listLeads(db, ctxA, filters)).rows
        .map((row) => row.name)
        .filter((n) => n.includes("Lista"));

    it("ordena pela última mensagem (sem mensagem por último)", async () => {
      expect(await names({})).toEqual(["Caio Lista", "Beatriz Lista", "Dora Lista 100%"]);
    });

    it("busca por nome, e-mail ou dígitos do telefone, só na própria organização", async () => {
      expect(await names({ search: "beatriz" })).toEqual(["Beatriz Lista"]);
      expect(await names({ search: "bia@exemplo" })).toEqual(["Beatriz Lista"]);
      expect(await names({ search: "1234" })).toEqual(["Beatriz Lista"]);
      const fromB = await listLeads(db, ctxB, { search: "1234" });
      expect(fromB.rows.map((row) => row.name)).toEqual(["Beatriz de Outra Org"]);
    });

    it("trata % e _ da busca como texto", async () => {
      expect(await names({ search: "100%" })).toEqual(["Dora Lista 100%"]);
      expect(await names({ search: "_" })).toEqual([]);
    });

    it("filtra por etapa e origem, com total e paginação", async () => {
      expect(await names({ stageId: stage(1) })).toEqual(["Caio Lista"]);
      expect(await names({ source: "site" })).toEqual(["Caio Lista", "Dora Lista 100%"]);

      const page = await listLeads(db, ctxA, { search: "Lista", pageSize: 2, page: 2 });
      expect(page.total).toBe(3);
      expect(page.rows.map((row) => row.name)).toEqual(["Dora Lista 100%"]);
    });

    it("traz o nome da etapa e do imóvel", async () => {
      const { rows } = await listLeads(db, ctxA, { search: "Beatriz" });
      expect(rows[0]).toMatchObject({ stageName: "Novo lead", propertyName: "Casa Lista" });
    });
  });

  describe("moveLead", () => {
    let ids: Record<string, string>;

    beforeEach(async () => {
      ids = {};
      for (const name of ["M1", "M2", "M3"]) {
        ids[name] = (await createLead(db, ctxA, { name, stageId: stage(2) })).id;
      }
    });

    it("reordena dentro da mesma coluna", async () => {
      expect((await columnNames(stage(2)))?.slice(0, 3)).toEqual(["M3", "M2", "M1"]);
      await moveLead(db, ctxA, { leadId: ids.M1 ?? "", toStageId: stage(2), toIndex: 0 });
      expect((await columnNames(stage(2)))?.slice(0, 3)).toEqual(["M1", "M3", "M2"]);
      await moveLead(db, ctxA, { leadId: ids.M1 ?? "", toStageId: stage(2), toIndex: 2 });
      expect((await columnNames(stage(2)))?.slice(0, 3)).toEqual(["M3", "M2", "M1"]);
      for (const id of Object.values(ids)) await deleteLead(db, ctxA, id);
    });

    it("move entre etapas na posição pedida e registra na linha do tempo", async () => {
      await createLead(db, ctxA, { name: "N1", stageId: stage(3) });
      await createLead(db, ctxA, { name: "N2", stageId: stage(3) });

      await moveLead(db, ctxA, { leadId: ids.M2 ?? "", toStageId: stage(3), toIndex: 1 });

      expect(await columnNames(stage(3))).toEqual(["N2", "M2", "N1"]);
      expect(await columnNames(stage(2))).not.toContain("M2");
      const [latest] = await listLeadActivities(db, ctxA, ids.M2 ?? "");
      expect(latest).toMatchObject({
        type: "stage_changed",
        actorName: "Ana",
        payload: { fromStageName: "Pronto para fechar", toStageName: "Aguardando pagamento" },
      });
    });

    it("coloca no fim quando o índice passa do tamanho da coluna", async () => {
      await moveLead(db, ctxA, { leadId: ids.M3 ?? "", toStageId: stage(4), toIndex: 99 });
      expect((await columnNames(stage(4)))?.at(-1)).toBe("M3");
    });

    it("recusa lead ou etapa de outra organização", async () => {
      const [stageB] = await listStages(db, ctxB);
      await expect(
        moveLead(db, ctxA, { leadId: ids.M1 ?? "", toStageId: stageB?.id ?? "", toIndex: 0 }),
      ).rejects.toThrow(NotFoundError);
      await expect(
        moveLead(db, ctxB, { leadId: ids.M1 ?? "", toStageId: stageB?.id ?? "", toIndex: 0 }),
      ).rejects.toThrow(NotFoundError);
      expect((await getLead(db, ctxA, ids.M1 ?? "")).stageId).toBe(stage(2));
    });
  });

  describe("updateLead", () => {
    it("altera só os campos enviados e normaliza o telefone", async () => {
      const created = await createLead(db, ctxA, { name: "Eva", guests: 2, notes: "VIP" });
      const updated = await updateLead(db, ctxA, created.id, {
        phone: "(21) 90000-0009",
        notes: null,
      });
      expect(updated).toMatchObject({
        name: "Eva",
        guests: 2,
        phone: "5521900000009",
        notes: null,
      });
    });

    it("valida as datas contra os valores já salvos", async () => {
      const created = await createLead(db, ctxA, {
        name: "Fábio",
        desiredCheckIn: "2026-12-20",
        desiredCheckOut: "2026-12-27",
      });
      await expect(
        updateLead(db, ctxA, created.id, { desiredCheckOut: "2026-12-19" }),
      ).rejects.toThrow(ValidationError);
    });

    it("trocar a etapa leva o lead ao topo e registra a mudança", async () => {
      const created = await createLead(db, ctxA, { name: "Gabi" });
      await updateLead(db, ctxA, created.id, { stageId: stage(1) });

      expect((await columnNames(stage(1)))?.[0]).toBe("Gabi");
      const types = (await listLeadActivities(db, ctxA, created.id)).map((a) => a.type);
      expect(types).toEqual(["stage_changed", "created"]);
    });

    it("recusa lead, etapa ou imóvel de outra organização", async () => {
      const deA = await createLead(db, ctxA, { name: "Helena" });
      const deB = await createLead(db, ctxB, { name: "Ivo" });
      const imovelA = await createProperty(db, ctxA, { name: "Imóvel da A" });
      const [stageA] = await listStages(db, ctxA);

      await expect(updateLead(db, ctxB, deA.id, { name: "Invasão" })).rejects.toThrow(
        NotFoundError,
      );
      await expect(
        updateLead(db, ctxB, deB.id, { propertyOfInterestId: imovelA.id }),
      ).rejects.toThrow(NotFoundError);
      await expect(updateLead(db, ctxB, deB.id, { stageId: stageA?.id })).rejects.toThrow(
        NotFoundError,
      );
      expect((await getLead(db, ctxA, deA.id)).name).toBe("Helena");
    });
  });

  describe("linha do tempo, conversa e exclusão", () => {
    it("adiciona nota e registra conversa atualizando a última mensagem", async () => {
      const created = await createLead(db, ctxA, { name: "Joana" });
      await addLeadNote(db, ctxA, created.id, { text: "Quer berço para bebê" });
      await logLeadMessage(db, ctxA, created.id);

      const lead = await getLead(db, ctxA, created.id);
      const activities = await listLeadActivities(db, ctxA, created.id);
      expect(lead.lastMessageAt).toBeInstanceOf(Date);
      expect(activities.map((a) => a.type)).toEqual(["message", "note", "created"]);
      expect(activities[1]?.payload).toEqual({ text: "Quer berço para bebê" });
    });

    it("não deixa outra organização anotar, registrar, listar ou excluir", async () => {
      const created = await createLead(db, ctxA, { name: "Kátia" });

      await expect(addLeadNote(db, ctxB, created.id, { text: "x" })).rejects.toThrow(NotFoundError);
      await expect(logLeadMessage(db, ctxB, created.id)).rejects.toThrow(NotFoundError);
      await expect(deleteLead(db, ctxB, created.id)).rejects.toThrow(NotFoundError);
      expect(await listLeadActivities(db, ctxB, created.id)).toEqual([]);
      expect((await getLead(db, ctxA, created.id)).name).toBe("Kátia");
    });

    it("exclui o lead e sua linha do tempo", async () => {
      const created = await createLead(db, ctxA, { name: "Lia" });
      await deleteLead(db, ctxA, created.id);
      await expect(getLead(db, ctxA, created.id)).rejects.toThrow(NotFoundError);
      expect(await listLeadActivities(db, ctxA, created.id)).toEqual([]);
    });
  });
});
