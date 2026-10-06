import { type Database, property } from "@hospedagens/db";
import { and, asc, eq, like } from "drizzle-orm";
import { z } from "zod";
import type { TenantContext } from "../context";
import { slugify } from "../shared/slug";

export type Property = typeof property.$inferSelect;

export const createPropertySchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(120).optional(),
  maxGuests: z.number().int().positive().max(100).optional(),
  bedrooms: z.number().int().nonnegative().max(50).optional(),
  basePriceCents: z.number().int().nonnegative().optional(),
});

export type CreatePropertyInput = z.input<typeof createPropertySchema>;

export async function listProperties(db: Database, ctx: TenantContext): Promise<Property[]> {
  return db
    .select()
    .from(property)
    .where(eq(property.organizationId, ctx.organizationId))
    .orderBy(asc(property.name));
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
