import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Modules validate env at import time; give them harmless values. No
    // test touches the database or the Anthropic API.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      JWT_SECRET: "test-secret-test-secret-test-secret-123",
      ANTHROPIC_API_KEY: "test-key",
      PHASE_TIMEZONE: "America/New_York",
    },
  },
});
