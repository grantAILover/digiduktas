import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Greiti testai su netikra (atmintyje) DB. Integraciniai — vitest.integration.config.ts
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/integration/**"],
  },
});
