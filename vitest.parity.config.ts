import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * The SAME unit tests as `npm test`, run against Postgres (a throw-away copy of the schema, never your real data).
 *   npm run test:parity                      the files listed below
 *   npm run test:parity -- tests/p1.test.ts  one file
 * Slower than the in-memory run (every reset re-seeds a real database).
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "."), "server-only": path.resolve(__dirname, "tests/server-only-stub.ts") } },
  test: {
    environment: "node", include: ["tests/services.test.ts"], testTimeout: 900000, hookTimeout: 900000, fileParallelism: false,
    globalSetup: ["tests-db/parity-global.ts"], setupFiles: ["tests-db/parity-env.ts"],
  },
});
