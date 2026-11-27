import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * A database handle typed with the content schema. Both the Neon driver
 * (production and scripts) and the PGlite driver (tests) satisfy it.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Connects to Postgres through Neon's WebSocket driver, which supports
 * interactive transactions. Node 24 has a global WebSocket, so no
 * `neonConfig.webSocketConstructor` is needed. Returns the Neon type so
 * scripts can run its migrator and close the pool with `$client.end()`.
 */
export function createDb(
  url: string,
): NeonDatabase<typeof schema> & { $client: Pool } {
  const pool = new Pool({ connectionString: url });
  // An idle client that loses its connection emits "error" on the pool;
  // without a listener Node would crash the process.
  pool.on("error", (error: Error) => {
    console.error("Database pool error:", error.message);
  });
  return drizzle({ client: pool, schema });
}

let db: Database | undefined;

/** Returns the process-wide database, creating its pool on first use. */
export function getDb(): Database {
  if (db === undefined) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env.local or the environment.",
      );
    }
    db = createDb(url);
  }
  return db;
}
