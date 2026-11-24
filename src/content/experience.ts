import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./db";
import { ContentNotFoundError } from "./errors";
import { applyReorder, nextPosition } from "./ordering";
import { experience } from "./schema";
import { touchContentState } from "./state";
import {
  bilingualText,
  optionalYearMonth,
  parseInput,
  requiredText,
  TEXT_LIMITS,
  technologies,
  yearMonth,
} from "./validation";

/** Input of `createExperience` and `updateExperience` (FR-009, FR-010). */
export const experienceInputSchema = z
  .strictObject({
    company: requiredText(TEXT_LIMITS.title),
    role: bilingualText(TEXT_LIMITS.title),
    startMonth: yearMonth(),
    /** Null or missing for the current position. */
    endMonth: optionalYearMonth(),
    location: bilingualText(TEXT_LIMITS.title),
    achievements: z
      .array(bilingualText(TEXT_LIMITS.achievement))
      .min(1, "At least one achievement is required.")
      .max(5, "At most 5 achievements."),
    technologies: technologies(),
  })
  .superRefine((value, ctx) => {
    // `YYYY-MM` strings sort in calendar order.
    if (value.endMonth !== null && value.endMonth < value.startMonth) {
      ctx.addIssue({
        code: "custom",
        path: ["endMonth"],
        message: "Must not be before the start month.",
        params: { code: "invalid_date_range" },
      });
    }
  });

export type ExperienceInput = z.input<typeof experienceInputSchema>;

/** A month as the first day of that month, for a `date` column. */
function toDate(month: string): string {
  return `${month}-01`;
}

/** A validated position as table columns, without id or position. */
export function toExperienceColumns(
  data: z.output<typeof experienceInputSchema>,
) {
  return {
    company: data.company,
    roleEn: data.role.en,
    roleEs: data.role.es,
    startMonth: toDate(data.startMonth),
    endMonth: data.endMonth === null ? null : toDate(data.endMonth),
    locationEn: data.location.en,
    locationEs: data.location.es,
    achievements: data.achievements,
    technologies: data.technologies,
  };
}

/** Adds a position at the end of the list (FR-018). */
export async function createExperience(
  db: Database,
  input: ExperienceInput,
): Promise<{ id: number }> {
  const data = parseInput(experienceInputSchema, input);
  return db.transaction(async (tx) => {
    const position = await nextPosition(tx, experience);
    const [row] = await tx
      .insert(experience)
      .values({ ...toExperienceColumns(data), position })
      .returning({ id: experience.id });
    await touchContentState(tx);
    return { id: (row as { id: number }).id };
  });
}

/** Replaces a position's content; its place in the list stays the same. */
export async function updateExperience(
  db: Database,
  id: number,
  input: ExperienceInput,
): Promise<void> {
  const data = parseInput(experienceInputSchema, input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(experience)
      .set(toExperienceColumns(data))
      .where(eq(experience.id, id))
      .returning({ id: experience.id });
    if (updated.length === 0) {
      throw new ContentNotFoundError("experience", id);
    }
    await touchContentState(tx);
  });
}

export async function deleteExperience(
  db: Database,
  id: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(experience)
      .where(eq(experience.id, id))
      .returning({ id: experience.id });
    if (deleted.length === 0) {
      throw new ContentNotFoundError("experience", id);
    }
    await touchContentState(tx);
  });
}

/** Sets the order of every position, not sorted by date (FR-018). */
export async function reorderExperience(
  db: Database,
  ids: readonly number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await applyReorder(tx, experience, ids);
    await touchContentState(tx);
  });
}
