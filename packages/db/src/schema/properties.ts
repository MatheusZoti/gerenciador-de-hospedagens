import { boolean, index, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { organization } from "./auth";

/** Imóvel (unidade de hospedagem) de uma organização. */
export const property = pgTable(
  "property",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address"),
    city: text("city"),
    maxGuests: integer("max_guests"),
    bedrooms: integer("bedrooms"),
    /** Diária base em centavos (BRL). */
    basePriceCents: integer("base_price_cents"),
    /**
     * Token secreto da URL de exportação iCal (fase 2): o Airbnb assina esse
     * feed para bloquear as datas das reservas diretas.
     */
    icalExportToken: text("ical_export_token")
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID().replaceAll("-", "")),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("property_organization_id_idx").on(t.organizationId),
    uniqueIndex("property_org_slug_uidx").on(t.organizationId, t.slug),
  ],
);
