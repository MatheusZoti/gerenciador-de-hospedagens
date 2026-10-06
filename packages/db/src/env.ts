import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Carrega o `.env` da raiz do monorepo em scripts que rodam fora do Next.js
 * (drizzle-kit, migrations, seed). Variáveis já definidas não são sobrescritas.
 */
export function loadRootEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
  for (const file of candidates) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      return;
    }
  }
}
