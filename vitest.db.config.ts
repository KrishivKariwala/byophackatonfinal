import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests that talk to the REAL Supabase database (SUPABASE_DB_URL in .env.local). Run with: npm run test:db
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "."), "server-only": path.resolve(__dirname, "tests/server-only-stub.ts") } },
  test: { environment: "node", include: ["tests-db/**/*.db.test.ts"], testTimeout: 120000, hookTimeout: 120000, fileParallelism: false },
});
