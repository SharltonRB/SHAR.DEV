import { eq, sql } from "drizzle-orm";
import type { Database } from "./db";
import { contentState } from "./schema";

const STATE_ID = 1;

/**
 * Records that the content changed (FR-023). Call it inside the write's
 * transaction so the date only moves when the write commits. Upserts the
 * single row, so writes also work on a database that has not been seeded.
 */
export async function touchContentState(tx: Database): Promise<void> {
  await tx
    .insert(contentState)
    .values({ id: STATE_ID, updatedAt: sql`now()` })
    .onConflictDoUpdate({
      target: contentState.id,
      set: { updatedAt: sql`now()` },
    });
}

/** Date of the last successful content write (FR-023). */
export async function getContentLastModified(db: Database): Promise<Date> {
  const [row] = await db
    .select({ updatedAt: contentState.updatedAt })
    .from(contentState)
    .where(eq(contentState.id, STATE_ID));
  if (row === undefined) {
    throw new Error(
      "Content state is missing. Run `pnpm db:setup` to seed the database.",
    );
  }
  return row.updatedAt;
}
