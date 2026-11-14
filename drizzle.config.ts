import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Local development reads DATABASE_URL from .env.local; CI and Vercel set it
// in the environment. `drizzle-kit generate` does not need a connection.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/content/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
