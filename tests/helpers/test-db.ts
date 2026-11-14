import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "../../src/content";
import * as schema from "../../src/content/schema";

const migrationsFolder = fileURLToPath(
  new URL("../../drizzle", import.meta.url),
);

/**
 * Creates an empty in-memory Postgres and applies the real migrations from
 * `drizzle/`, so every test file starts from the same schema as production.
 */
export async function createTestDb(): Promise<Database & { $client: PGlite }> {
  const db = drizzle({ client: new PGlite(), schema });
  await migrate(db, { migrationsFolder });
  return db;
}
