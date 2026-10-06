import type { Database } from "@hospedagens/db";
import { createTestDb } from "@hospedagens/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TenantContext } from "../context";
import { NotFoundError } from "../shared/errors";
import { createTenant } from "../test-utils";
import {
  createProperty,
  getProperty,
  listProperties,
  setPropertyActive,
  updateProperty,
} from "./service";

describe("imóveis", () => {
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

  it("gera slugs únicos por organização", async () => {
    const first = await createProperty(db, ctxA, { name: "Chalé da Serra" });
    const second = await createProperty(db, ctxA, { name: "Chalé da Serra" });
    const otherOrg = await createProperty(db, ctxB, { name: "Chalé da Serra" });

    expect(first.slug).toBe("chale-da-serra");
    expect(second.slug).toBe("chale-da-serra-2");
    expect(otherOrg.slug).toBe("chale-da-serra");
  });

  it("edita campos enviados, limpa com null e mantém o slug", async () => {
    const casa = await createProperty(db, ctxA, {
      name: "Casa Azul",
      city: "Ubatuba",
      basePriceCents: 50_000,
    });
    const updated = await updateProperty(db, ctxA, casa.id, {
      name: "Casa Azul do Mar",
      city: null,
      maxGuests: 6,
    });

    expect(updated).toMatchObject({
      name: "Casa Azul do Mar",
      city: null,
      maxGuests: 6,
      basePriceCents: 50_000,
      slug: "casa-azul",
    });
  });

  it("desativa e lista só os ativos quando pedido", async () => {
    const praia = await createProperty(db, ctxA, { name: "Bangalô Praia" });
    await setPropertyActive(db, ctxA, praia.id, false);

    const all = await listProperties(db, ctxA);
    const active = await listProperties(db, ctxA, { activeOnly: true });
    expect(all.map((p) => p.id)).toContain(praia.id);
    expect(active.map((p) => p.id)).not.toContain(praia.id);
  });

  it("não lê nem altera imóvel de outra organização", async () => {
    const [deA] = await listProperties(db, ctxA);
    const id = deA?.id ?? "";

    await expect(getProperty(db, ctxB, id)).rejects.toThrow(NotFoundError);
    await expect(updateProperty(db, ctxB, id, { name: "Invasão" })).rejects.toThrow(NotFoundError);
    await expect(setPropertyActive(db, ctxB, id, false)).rejects.toThrow(NotFoundError);
    expect((await getProperty(db, ctxA, id)).name).not.toBe("Invasão");
  });
});
