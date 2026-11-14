import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Removed in T010, once the first test exists.
    passWithNoTests: true,
  },
});
