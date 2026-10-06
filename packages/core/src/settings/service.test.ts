import type { Database } from "@hospedagens/db";
import { createTestDb } from "@hospedagens/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantContext } from "../context";
import { ForbiddenError } from "../shared/errors";
import { createTenant } from "../test-utils";
import {
  DEFAULT_TIME_ZONE,
  getOrganizationSettings,
  isValidTimeZone,
  updateOrganizationSettings,
} from "./service";

describe("configurações da organização", () => {
  let db: Database;
  let close: () => Promise<void>;
  let ctxA: TenantContext;
  let ctxB: TenantContext;

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    ctxA = await createTenant(db, "Ana");
    ctxB = await createTenant(db, "Bruno");
  });

  afterAll(async () => {
    await close();
  });

  it("usa o fuso padrão enquanto nada foi salvo", async () => {
    expect(await getOrganizationSettings(db, ctxA)).toEqual({
      name: "Org Ana",
      timeZone: DEFAULT_TIME_ZONE,
    });
  });

  it("salva nome e fuso só da própria organização (e salva de novo sem duplicar)", async () => {
    await updateOrganizationSettings(db, ctxA, {
      name: "Pousada da Ana",
      timeZone: "America/Manaus",
    });
    await updateOrganizationSettings(db, ctxA, {
      name: "Pousada da Ana",
      timeZone: "America/Recife",
    });

    expect(await getOrganizationSettings(db, ctxA)).toEqual({
      name: "Pousada da Ana",
      timeZone: "America/Recife",
    });
    expect(await getOrganizationSettings(db, ctxB)).toEqual({
      name: "Org Bruno",
      timeZone: DEFAULT_TIME_ZONE,
    });
  });

  it("valida o fuso horário e o nome", async () => {
    expect(isValidTimeZone("America/Sao_Paulo")).toBe(true);
    expect(isValidTimeZone("Marte/Olympus")).toBe(false);
    await expect(
      updateOrganizationSettings(db, ctxA, { name: "Ok", timeZone: "Marte/Olympus" }),
    ).rejects.toThrow("Fuso horário inválido");
    await expect(
      updateOrganizationSettings(db, ctxA, { name: "", timeZone: DEFAULT_TIME_ZONE }),
    ).rejects.toThrow("Informe o nome da organização");
  });

  it("só owner/admin podem alterar", async () => {
    const member: TenantContext = { ...ctxA, role: "member" };
    await expect(
      updateOrganizationSettings(db, member, { name: "Golpe", timeZone: DEFAULT_TIME_ZONE }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      updateOrganizationSettings(
        db,
        { ...ctxA, role: "admin" },
        {
          name: "Pousada da Ana",
          timeZone: DEFAULT_TIME_ZONE,
        },
      ),
    ).resolves.toBeTruthy();
  });
});
