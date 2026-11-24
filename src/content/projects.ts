import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./db";
import { ContentNotFoundError, ContentValidationError } from "./errors";
import { applyReorder, nextPosition } from "./ordering";
import { projects } from "./schema";
import { touchContentState } from "./state";
import {
  bilingualText,
  optionalBilingualText,
  optionalHttpsUrl,
  parseInput,
  TEXT_LIMITS,
  technologies,
  whenFieldsValid,
} from "./validation";

export const PROJECT_STATUSES = ["draft", "published"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const projectFields = {
  title: bilingualText(TEXT_LIMITS.title),
  description: bilingualText(TEXT_LIMITS.projectDescription),
  technologies: technologies(),
  demoUrl: optionalHttpsUrl(),
  codeUrl: optionalHttpsUrl(),
  imageUrl: optionalHttpsUrl(),
  imageAlt: optionalBilingualText(TEXT_LIMITS.imageAlt),
};

/** An image needs English alt text (FR-014). */
function requireImageAlt(
  value: { imageUrl: string | null; imageAlt: { en: string | null } },
  ctx: z.RefinementCtx,
): void {
  if (value.imageUrl !== null && value.imageAlt.en === null) {
    ctx.addIssue({
      code: "custom",
      path: ["imageAlt", "en"],
      message: "Required when the project has an image.",
      params: { code: "required" },
    });
  }
}

/** Input of `createProject` and `updateProject` (FR-014). */
const imageFieldsValid = whenFieldsValid("imageUrl", "imageAlt");

export const projectInputSchema = z
  .strictObject(projectFields)
  .superRefine(requireImageAlt, imageFieldsValid);

/** A project in the import file: the same input plus a status, draft by default. */
export const importedProjectSchema = z
  .strictObject({
    ...projectFields,
    status: z.enum(PROJECT_STATUSES).default("draft"),
  })
  .superRefine(requireImageAlt, imageFieldsValid);

export type ProjectInput = z.input<typeof projectInputSchema>;

/** A validated project as table columns, without id, status or position. */
export function toProjectColumns(data: z.output<typeof projectInputSchema>) {
  return {
    titleEn: data.title.en,
    titleEs: data.title.es,
    descriptionEn: data.description.en,
    descriptionEs: data.description.es,
    technologies: data.technologies,
    demoUrl: data.demoUrl,
    codeUrl: data.codeUrl,
    imageUrl: data.imageUrl,
    imageAltEn: data.imageAlt.en,
    imageAltEs: data.imageAlt.es,
  };
}

/** Adds a project as a draft at the end of the list (FR-015, FR-018). */
export async function createProject(
  db: Database,
  input: ProjectInput,
): Promise<{ id: number }> {
  const data = parseInput(projectInputSchema, input);
  return db.transaction(async (tx) => {
    const position = await nextPosition(tx, projects);
    const [row] = await tx
      .insert(projects)
      .values({ ...toProjectColumns(data), status: "draft", position })
      .returning({ id: projects.id });
    await touchContentState(tx);
    return { id: (row as { id: number }).id };
  });
}

/** Replaces a project's content; its status and position stay the same. */
export async function updateProject(
  db: Database,
  id: number,
  input: ProjectInput,
): Promise<void> {
  const data = parseInput(projectInputSchema, input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(projects)
      .set(toProjectColumns(data))
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (updated.length === 0) {
      throw new ContentNotFoundError("project", id);
    }
    await touchContentState(tx);
  });
}

/** Publishes a project or turns it back into a draft (FR-006, FR-015). */
export async function setProjectStatus(
  db: Database,
  id: number,
  status: ProjectStatus,
): Promise<void> {
  if (!PROJECT_STATUSES.includes(status)) {
    throw new ContentValidationError([
      {
        field: "status",
        code: "required",
        message: `Must be one of: ${PROJECT_STATUSES.join(", ")}.`,
      },
    ]);
  }
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(projects)
      .set({ status })
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (updated.length === 0) {
      throw new ContentNotFoundError("project", id);
    }
    await touchContentState(tx);
  });
}

export async function deleteProject(db: Database, id: number): Promise<void> {
  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (deleted.length === 0) {
      throw new ContentNotFoundError("project", id);
    }
    await touchContentState(tx);
  });
}

/** Sets the order of every project, drafts included (FR-018). */
export async function reorderProjects(
  db: Database,
  ids: readonly number[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await applyReorder(tx, projects, ids);
    await touchContentState(tx);
  });
}
