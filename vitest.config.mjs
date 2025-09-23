import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/native-test/**/*.test.ts"],
    globals: false,
    environment: "node",
    slowTestThreshold: 1000,
  },
});
