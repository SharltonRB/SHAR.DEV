import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./db";
import { ContentNotFoundError, ContentValidationError } from "./errors";
import { applyReorder, nextPosition } from "./ordering";
import { profile, profileValues } from "./schema";
import { touchContentState } from "./state";
import {
  bilingualText,
  optionalBilingualText,
  parseInput,
  requiredText,
  TEXT_LIMITS,
} from "./validation";

const PROFILE_ID = 1;
const MIN_VALUES = 1;
const MAX_VALUES = 6;

/** Input of `updateProfile`, which replaces the whole profile (FR-007). */
export const profileInputSchema = z.strictObject({
  name: requiredText(TEXT_LIMITS.title),
  title: bilingualText(TEXT_LIMITS.title),
  slogan: bilingualText(TEXT_LIMITS.slogan),
  headline: optionalBilingualText(TEXT_LIMITS.headline),
  summary: bilingualText(TEXT_LIMITS.longText),
  mission: bilingualText(TEXT_LIMITS.longText),
  vision: bilingualText(TEXT_LIMITS.longText),
});

/** Input of `createValue` and `updateValue` (FR-008). */
export const valueInputSchema = z.strictObject({
  title: bilingualText(TEXT_LIMITS.title),
  description: bilingualText(TEXT_LIMITS.valueDescription),
});

export type ProfileInput = z.input<typeof profileInputSchema>;
export type ValueInput = z.input<typeof valueInputSchema>;

function missingProfile(): Error {
  return new Error(
    "Profile is missing. Run `pnpm db:setup` to seed the database.",
  );
}

/**
 * Locks the profile row. Value writes take it first, so two of them cannot
 * both pass the 1 to 6 limit check at the same time.
 */
async function lockProfile(tx: Database): Promise<void> {
  const [row] = await tx
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.id, PROFILE_ID))
    .for("update");
  if (row === undefined) {
    throw missingProfile();
  }
}

async function countValues(tx: Database): Promise<number> {
  const [row] = await tx
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(profileValues);
  return row?.count ?? 0;
}

function valueColumns(data: z.output<typeof valueInputSchema>) {
  return {
    titleEn: data.title.en,
    titleEs: data.title.es,
    descriptionEn: data.description.en,
    descriptionEs: data.description.es,
  };
}

/** Replaces the profile in both languages. The seed never overwrites it. */
export async function updateProfile(
  db: Database,
  input: ProfileInput,
): Promise<void> {
  const data = parseInput(profileInputSchema, input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(profile)
      .set({
        name: data.name,
        titleEn: data.title.en,
        titleEs: data.title.es,
        sloganEn: data.slogan.en,
        sloganEs: data.slogan.es,
        headlineEn: data.headline.en,
        headlineEs: data.headline.es,
        summaryEn: data.summary.en,
        summaryEs: data.summary.es,
        missionEn: data.mission.en,
        missionEs: data.mission.es,
        visionEn: data.vision.en,
        visionEs: data.vision.es,
      })
      .where(eq(profile.id, PROFILE_ID))
      .returning({ id: profile.id });
    if (updated.length === 0) {
      throw missingProfile();
    }
    await touchContentState(tx);
  });
}

/** Adds a value at the end; a 7th is rejected (FR-008, FR-018). */
export async function createValue(
  db: Database,
  input: ValueInput,
): Promise<{ id: number }> {
  const data = parseInput(valueInputSchema, input);
  return db.transaction(async (tx) => {
    await lockProfile(tx);
    if ((await countValues(tx)) >= MAX_VALUES) {
      throw new ContentValidationError([
        {
          field: "values",
          code: "too_many",
          message: `At most ${MAX_VALUES} values.`,
        },
      ]);
    }
    const position = await nextPosition(tx, profileValues);
    const [row] = await tx
      .insert(profileValues)
      .values({ ...valueColumns(data), position })
      .returning({ id: profileValues.id });
    await touchContentState(tx);
    return { id: (row as { id: number }).id };
  });
}

export async function updateValue(
  db: Database,
  id: number,
  input: ValueInput,
): Promise<void> {
  const data = parseInput(valueInputSchema, input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(profileValues)
      .set(valueColumns(data))
      .where(eq(profileValues.id, id))
      .returning({ id: profileValues.id });
    if (updated.length === 0) {
      throw new ContentNotFoundError("value", id);
    }
    await touchContentState(tx);
  });
}

/** Deletes a value; the last one is kept (FR-008). */
export async function deleteValue(db: Database, id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await lockProfile(tx);
    const [row] = await tx
      .select({ id: profileValues.id })
      .from(profileValues)
      .where(eq(profileValues.id, id));
    if (row === undefined) {
      throw new ContentNotFoundError("value", id);
    }
    if ((await countValues(tx)) <= MIN_VALUES) {
      throw new ContentValidationError([
        {
          field: "values",
          code: "too_few",
          message: `At least ${MIN_VALUES} value is required.`,
        },
      ]);
    }
    await tx.delete(profileValues).where(eq(profileValues.id, id));
    await touchContentState(tx);
  });
}

export async function reorderValues(
  db: Database,
  ids: readonly number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await applyReorder(tx, profileValues, ids);
    await touchContentState(tx);
  });
}
