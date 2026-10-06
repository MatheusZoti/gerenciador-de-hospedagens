import { type Database, property } from "@hospedagens/db";
import { and, asc, eq, like } from "drizzle-orm";
import type { TenantContext } from "../context";
import { NotFoundError } from "../shared/errors";
import { slugify } from "../shared/slug";
import { z } from "../shared/zod";

export type Property = typeof property.$inferSelect;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value === "" ? null : value));

const propertyFields = {
  name: z.string().trim().min(2, "Informe o nome do imóvel").max(120),
  address: optionalText(240),
  city: optionalText(120),
  maxGuests: z.number().int().positive().max(100).nullish(),
  bedrooms: z.number().int().nonnegative().max(50).nullish(),
  basePriceCents: z.number().int().nonnegative().nullish(),
};

export const createPropertySchema = z.object(propertyFields);
/** Edição parcial: o slug não muda (será usado em URLs do site de reservas). */
export const updatePropertySchema = z.object(propertyFields).partial();

export type CreatePropertyInput = z.input<typeof createPropertySchema>;
export type UpdatePropertyInput = z.input<typeof updatePropertySchema>;

export async function listProperties(
  db: Database,
  ctx: TenantContext,
  opts: { activeOnly?: boolean } = {},
): Promise<Property[]> {
  const filters = [eq(property.organizationId, ctx.organizationId)];
  if (opts.activeOnly) filters.push(eq(property.isActive, true));

  return db
    .select()
    .from(property)
    .where(and(...filters))
    .orderBy(asc(property.name));
}

export async function getProperty(
  db: Database,
  ctx: TenantContext,
  propertyId: string,
): Promise<Property> {
  const [found] = await db
    .select()
    .from(property)
    .where(and(eq(property.id, propertyId), eq(property.organizationId, ctx.organizationId)));
  if (!found) throw new NotFoundError("Imóvel");
  return found;
}

export async function createProperty(
  db: Database,
  ctx: TenantContext,
  input: CreatePropertyInput,
): Promise<Property> {
  const data = createPropertySchema.parse(input);
  const slug = await uniquePropertySlug(db, ctx, data.name);

  const [created] = await db
    .insert(property)
    .values({ ...data, slug, organizationId: ctx.organizationId })
    .returning();
  if (!created) throw new Error("Falha ao criar imóvel");
  return created;
}

export async function updateProperty(
  db: Database,
  ctx: TenantContext,
  propertyId: string,
  input: UpdatePropertyInput,
): Promise<Property> {
  const data = updatePropertySchema.parse(input);
  if (Object.values(data).every((value) => value === undefined)) {
    return getProperty(db, ctx, propertyId);
  }

  const [updated] = await db
    .update(property)
    .set(data)
    .where(and(eq(property.id, propertyId), eq(property.organizationId, ctx.organizationId)))
    .returning();
  if (!updated) throw new NotFoundError("Imóvel");
  return updated;
}

/** Imóveis inativos somem das listas de seleção, mas mantêm o histórico. */
export async function setPropertyActive(
  db: Database,
  ctx: TenantContext,
  propertyId: string,
  isActive: boolean,
): Promise<Property> {
  const [updated] = await db
    .update(property)
    .set({ isActive })
    .where(and(eq(property.id, propertyId), eq(property.organizationId, ctx.organizationId)))
    .returning();
  if (!updated) throw new NotFoundError("Imóvel");
  return updated;
}

/** Garante que o imóvel existe e pertence à organização. */
export async function assertPropertyInTenant(
  db: Database,
  ctx: TenantContext,
  propertyId: string,
): Promise<void> {
  const [owned] = await db
    .select({ id: property.id })
    .from(property)
    .where(and(eq(property.id, propertyId), eq(property.organizationId, ctx.organizationId)));
  if (!owned) throw new NotFoundError("Imóvel");
}

async function uniquePropertySlug(db: Database, ctx: TenantContext, name: string) {
  const base = slugify(name) || "imovel";
  const taken = await db
    .select({ slug: property.slug })
    .from(property)
    .where(and(eq(property.organizationId, ctx.organizationId), like(property.slug, `${base}%`)));
  const used = new Set(taken.map((row) => row.slug));

  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
