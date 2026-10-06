import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { migrationsFolder } from "./paths";
import * as schema from "./schema";
import type { Database } from "./types";

/**
 * Banco Postgres em memória (PGlite) com todas as migrations aplicadas.
 * Usado nos testes de serviços — não precisa de Postgres rodando.
 */
export async function createTestDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return { db, close: () => client.close() };
}
