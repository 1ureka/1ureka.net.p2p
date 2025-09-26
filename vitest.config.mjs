import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: false,
    environment: "node",
    slowTestThreshold: 1000,
  },
  resolve: { alias: { "@": "/src" } },
});
