import { inArray, type SQL, sql } from "drizzle-orm";
import type { Database } from "./db";
import { ContentValidationError } from "./errors";
import type {
  experience,
  profileValues,
  projects,
  skillCategories,
  skills,
} from "./schema";

/** Every table whose rows the administrator can reorder. */
export type OrderedTable =
  | typeof profileValues
  | typeof experience
  | typeof skillCategories
  | typeof skills
  | typeof projects;

/**
 * Position for a new element: right after the last one of its list
 * (FR-018). `scope` narrows the list, for example the skills of one
 * category. Deletions leave gaps, which do not change the relative order.
 */
export async function nextPosition(
  tx: Database,
  table: OrderedTable,
  scope?: SQL,
): Promise<number> {
  const [row] = await tx
    .select({
      next: sql`coalesce(max(${table.position}), -1) + 1`.mapWith(Number),
    })
    .from(table)
    .where(scope);
  return row?.next ?? 0;
}

function invalidOrder(): ContentValidationError {
  return new ContentValidationError([
    {
      field: "ids",
      code: "invalid_order",
      message:
        "Must list every existing element of the list exactly once, and nothing else.",
    },
  ]);
}

/**
 * Sets `position = index` for each id, in one statement. Rejects the whole
 * order, changing nothing, if `ids` omits, repeats or adds an element of
 * the list in `scope` (FR-018). Call it inside the write's transaction.
 */
export async function applyReorder(
  tx: Database,
  table: OrderedTable,
  ids: readonly number[],
  scope?: SQL,
): Promise<void> {
  if (!Array.isArray(ids)) {
    throw invalidOrder();
  }
  const existing = await tx
    .select({ id: table.id })
    .from(table)
    .where(scope)
    .for("update");
  const existingIds = new Set(existing.map((row) => row.id));
  if (ids.length !== existingIds.size || new Set(ids).size !== ids.length) {
    throw invalidOrder();
  }
  // An indexed loop, not `every`, so holes in a sparse array are rejected.
  for (let index = 0; index < ids.length; index++) {
    if (!existingIds.has(ids[index] as number)) {
      throw invalidOrder();
    }
  }
  if (ids.length === 0) {
    return;
  }

  // Casts keep Postgres from typing the untyped parameters as text.
  const cases = ids.map(
    (id, index) => sql`WHEN ${id}::integer THEN ${index}::integer`,
  );
  await tx
    .update(table)
    .set({
      position: sql`CASE ${table.id} ${sql.join(cases, sql` `)} END`,
    })
    .where(inArray(table.id, [...ids]));
}
