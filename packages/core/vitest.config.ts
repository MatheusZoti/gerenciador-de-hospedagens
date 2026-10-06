import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // PGlite inicializa um Postgres em WASM por arquivo de teste.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
