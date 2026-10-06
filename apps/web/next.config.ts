import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// O .env fica na raiz do monorepo (compartilhado com drizzle-kit e scripts).
// Variáveis já definidas no ambiente (CI, Vercel) têm prioridade.
const rootEnv = resolve(import.meta.dirname, "../../.env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const nextConfig: NextConfig = {
  // Pacotes internos do monorepo são publicados como TypeScript fonte.
  transpilePackages: ["@hospedagens/core", "@hospedagens/db"],
  serverExternalPackages: ["pg"],
  typedRoutes: true,
};

export default nextConfig;
