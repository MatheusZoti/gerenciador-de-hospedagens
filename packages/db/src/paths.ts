import { fileURLToPath } from "node:url";

/** Pasta das migrations SQL geradas pelo drizzle-kit. */
export const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
