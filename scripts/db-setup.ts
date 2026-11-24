import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { createDb, seedContent } from "../src/content";

// Resolved from this file, so the script works from any working directory.
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

/**
 * Drizzle wraps driver errors; a failed connection arrives as a WebSocket
 * event without a message, so it gets a hint instead.
 */
function describe(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  const { cause } = error;
  if (cause instanceof Error) {
    return `${error.message.trim()} (${cause.message})`;
  }
  if (cause !== undefined) {
    return `${error.message.trim()} (could not connect: check DATABASE_URL)`;
  }
  return error.message;
}

/**
 * Prepares a database from scratch or brings it up to date: applies the
 * pending migrations, then seeds the approved content if it is missing
 * (FR-024 to FR-026, SC-007). Safe to run again.
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local or the environment.",
    );
    process.exitCode = 1;
    return;
  }

  const db = createDb(url);
  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied");

    const { applied } = await seedContent(db);
    console.log(
      applied ? "Seed applied" : "Seed skipped: content already exists",
    );
  } catch (error) {
    console.error("Database setup failed:", describe(error));
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

await main();
