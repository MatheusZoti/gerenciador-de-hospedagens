import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import type { Database } from "./types";

export function createDb(connectionString: string): Database {
  const pool = new Pool({ connectionString, max: 10 });
  return drizzle(pool, { schema });
}

const globalForDb = globalThis as unknown as { __hospedagensDb?: Database };

/**
 * Instância única por processo (reaproveitada entre hot reloads do Next.js).
 * A conexão só é aberta na primeira query.
 */
export function getDb(): Database {
  if (!globalForDb.__hospedagensDb) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL não definida. Copie .env.example para .env.");
    }
    globalForDb.__hospedagensDb = createDb(url);
  }
  return globalForDb.__hospedagensDb;
}
