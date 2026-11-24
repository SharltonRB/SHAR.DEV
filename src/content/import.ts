import { z } from "zod";
import type { Database } from "./db";
import { experienceInputSchema, toExperienceColumns } from "./experience";
import { importedProjectSchema, toProjectColumns } from "./projects";
import { experience, projects, skillCategories, skills } from "./schema";
import { skillCategoryInputSchema, skillInputSchema } from "./skills";
import { touchContentState } from "./state";
import { parseInput } from "./validation";

/** A category in the import file, with its skills as plain names. */
const importedCategorySchema = z
  .strictObject({
    ...skillCategoryInputSchema.shape,
    skills: z.array(skillInputSchema.shape.name),
  })
  .superRefine((value, ctx) => {
    // Same rule as createSkill: unique per category, ignoring case (FR-013).
    const seen = new Set<string>();
    value.skills.forEach((name, index) => {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["skills", index],
          message: "Another skill in this category has the same name.",
          params: { code: "duplicate" },
        });
      }
      seen.add(key);
    });
  });

/** The whole import file. The three keys are required; `[]` empties a section. */
export const importInputSchema = z.strictObject({
  experience: z.array(experienceInputSchema),
  skillCategories: z.array(importedCategorySchema),
  projects: z.array(importedProjectSchema),
});

export type ImportInput = z.input<typeof importInputSchema>;

export type ImportResult = {
  experience: number;
  skillCategories: number;
  skills: number;
  projects: number;
};

/**
 * Replaces experience, skill categories with their skills and projects
 * with the file's, in its order (FR-027, FR-028). Validates everything
 * first and writes in one transaction, so a rejected file changes nothing.
 * The profile, values and contact are not touched.
 */
export async function importContent(
  db: Database,
  input: ImportInput,
): Promise<ImportResult> {
  const data = parseInput(importInputSchema, input);
  return db.transaction(async (tx) => {
    // Skills first: their foreign key restricts deleting categories.
    await tx.delete(skills);
    await tx.delete(skillCategories);
    await tx.delete(experience);
    await tx.delete(projects);

    if (data.experience.length > 0) {
      await tx.insert(experience).values(
        data.experience.map((item, position) => ({
          ...toExperienceColumns(item),
          position,
        })),
      );
    }

    let skillCount = 0;
    for (const [position, category] of data.skillCategories.entries()) {
      const [row] = await tx
        .insert(skillCategories)
        .values({
          nameEn: category.name.en,
          nameEs: category.name.es,
          position,
        })
        .returning({ id: skillCategories.id });
      const categoryId = (row as { id: number }).id;
      if (category.skills.length > 0) {
        await tx.insert(skills).values(
          category.skills.map((name, skillPosition) => ({
            categoryId,
            name,
            position: skillPosition,
          })),
        );
      }
      skillCount += category.skills.length;
    }

    if (data.projects.length > 0) {
      await tx.insert(projects).values(
        data.projects.map((item, position) => ({
          ...toProjectColumns(item),
          status: item.status,
          position,
        })),
      );
    }

    await touchContentState(tx);
    return {
      experience: data.experience.length,
      skillCategories: data.skillCategories.length,
      skills: skillCount,
      projects: data.projects.length,
    };
  });
}
