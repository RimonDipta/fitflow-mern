import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 180000,
    fileParallelism: false,
    server: {
      deps: {
        inline: ["supertest"],
      },
    },
  },
});
