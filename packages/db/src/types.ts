import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

export type Schema = typeof schema;

/**
 * Tipo de banco aceito pelos serviços de domínio. Cobre tanto o driver de
 * produção (node-postgres) quanto o PGlite usado nos testes.
 */
export type Database = PgDatabase<PgQueryResultHKT, Schema>;
