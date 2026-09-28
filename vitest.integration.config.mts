import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Integraciniai testai su TIKRU Supabase (reikia .env.local su service-role raktu).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
