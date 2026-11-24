import { and, eq, ne, type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./db";
import { ContentNotFoundError, ContentValidationError } from "./errors";
import { applyReorder, nextPosition } from "./ordering";
import { skillCategories, skills } from "./schema";
import { touchContentState } from "./state";
import {
  bilingualText,
  parseInput,
  requiredText,
  TEXT_LIMITS,
} from "./validation";

/** Input of `createSkillCategory` and `updateSkillCategory` (FR-011). */
export const skillCategoryInputSchema = z.strictObject({
  name: bilingualText(TEXT_LIMITS.title),
});

/**
 * Input of `createSkill` and `updateSkill`: only a name. Any level,
 * percentage or years field is rejected as unknown (FR-012).
 */
export const skillInputSchema = z.strictObject({
  name: requiredText(TEXT_LIMITS.title),
});

export type SkillCategoryInput = z.input<typeof skillCategoryInputSchema>;
export type SkillInput = z.input<typeof skillInputSchema>;

/** A name that matches another in the same category, ignoring case (FR-013). */
export function duplicateSkillError(field: string): ContentValidationError {
  return new ContentValidationError([
    {
      field,
      code: "duplicate",
      message: "Another skill in this category has the same name.",
    },
  ]);
}

const inCategory = (categoryId: number): SQL =>
  eq(skills.categoryId, categoryId);

/** Locks the category row so its skills cannot change underneath. */
async function lockCategory(tx: Database, categoryId: number): Promise<void> {
  const [row] = await tx
    .select({ id: skillCategories.id })
    .from(skillCategories)
    .where(eq(skillCategories.id, categoryId))
    .for("update");
  if (row === undefined) {
    throw new ContentNotFoundError("skillCategory", categoryId);
  }
}

async function assertUniqueName(
  tx: Database,
  categoryId: number,
  name: string,
  exceptId?: number,
): Promise<void> {
  const [match] = await tx
    .select({ id: skills.id })
    .from(skills)
    .where(
      and(
        inCategory(categoryId),
        sql`lower(${skills.name}) = lower(${name})`,
        exceptId === undefined ? undefined : ne(skills.id, exceptId),
      ),
    );
  if (match !== undefined) {
    throw duplicateSkillError("name");
  }
}

/** Adds a category at the end of the list (FR-018). */
export async function createSkillCategory(
  db: Database,
  input: SkillCategoryInput,
): Promise<{ id: number }> {
  const data = parseInput(skillCategoryInputSchema, input);
  return db.transaction(async (tx) => {
    const position = await nextPosition(tx, skillCategories);
    const [row] = await tx
      .insert(skillCategories)
      .values({ nameEn: data.name.en, nameEs: data.name.es, position })
      .returning({ id: skillCategories.id });
    await touchContentState(tx);
    return { id: (row as { id: number }).id };
  });
}

export async function updateSkillCategory(
  db: Database,
  id: number,
  input: SkillCategoryInput,
): Promise<void> {
  const data = parseInput(skillCategoryInputSchema, input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(skillCategories)
      .set({ nameEn: data.name.en, nameEs: data.name.es })
      .where(eq(skillCategories.id, id))
      .returning({ id: skillCategories.id });
    if (updated.length === 0) {
      throw new ContentNotFoundError("skillCategory", id);
    }
    await touchContentState(tx);
  });
}

/** Deletes an empty category; one with skills is rejected (FR-013). */
export async function deleteSkillCategory(
  db: Database,
  id: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    await lockCategory(tx, id);
    const [skill] = await tx
      .select({ id: skills.id })
      .from(skills)
      .where(inCategory(id))
      .limit(1);
    if (skill !== undefined) {
      throw new ContentValidationError([
        {
          field: "skills",
          code: "not_empty",
          message: "Delete or move the category's skills first.",
        },
      ]);
    }
    await tx.delete(skillCategories).where(eq(skillCategories.id, id));
    await touchContentState(tx);
  });
}

export async function reorderSkillCategories(
  db: Database,
  ids: readonly number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await applyReorder(tx, skillCategories, ids);
    await touchContentState(tx);
  });
}

/** Adds a skill at the end of its category (FR-011, FR-013, FR-018). */
export async function createSkill(
  db: Database,
  categoryId: number,
  input: SkillInput,
): Promise<{ id: number }> {
  const data = parseInput(skillInputSchema, input);
  return db.transaction(async (tx) => {
    await lockCategory(tx, categoryId);
    await assertUniqueName(tx, categoryId, data.name);
    const position = await nextPosition(tx, skills, inCategory(categoryId));
    const [row] = await tx
      .insert(skills)
      .values({ categoryId, name: data.name, position })
      .returning({ id: skills.id });
    await touchContentState(tx);
    return { id: (row as { id: number }).id };
  });
}

/** Renames a skill; it stays in its category and place. */
export async function updateSkill(
  db: Database,
  id: number,
  input: SkillInput,
): Promise<void> {
  const data = parseInput(skillInputSchema, input);
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ categoryId: skills.categoryId })
      .from(skills)
      .where(eq(skills.id, id));
    if (current === undefined) {
      throw new ContentNotFoundError("skill", id);
    }
    await lockCategory(tx, current.categoryId);
    await assertUniqueName(tx, current.categoryId, data.name, id);
    await tx.update(skills).set({ name: data.name }).where(eq(skills.id, id));
    await touchContentState(tx);
  });
}

export async function deleteSkill(db: Database, id: number): Promise<void> {
  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(skills)
      .where(eq(skills.id, id))
      .returning({ id: skills.id });
    if (deleted.length === 0) {
      throw new ContentNotFoundError("skill", id);
    }
    await touchContentState(tx);
  });
}

/** Sets the order of the skills of one category, and only those (FR-018). */
export async function reorderSkills(
  db: Database,
  categoryId: number,
  ids: readonly number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await lockCategory(tx, categoryId);
    await applyReorder(tx, skills, ids, inCategory(categoryId));
    await touchContentState(tx);
  });
}
