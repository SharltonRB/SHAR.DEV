import { readFile } from "node:fs/promises";
import {
  ContentValidationError,
  createDb,
  type ImportInput,
  importContent,
} from "../src/content";

/** Reads and parses the file, or explains why it could not (US6-5). */
async function readJson(path: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new Error(
      code === "ENOENT"
        ? `File not found: ${path}`
        : `Could not read ${path}: ${(error as Error).message}`,
    );
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${(error as Error).message}`);
  }
}

/**
 * Replaces experience, skills and projects with those of a JSON file
 * (FR-027, FR-028). Profile, values and contact stay as they are.
 * Usage: pnpm content:import <file.json>
 */
async function main(): Promise<void> {
  const [path] = process.argv.slice(2);
  if (!path) {
    console.error("Usage: pnpm content:import <file.json>");
    process.exitCode = 1;
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local or the environment.",
    );
    process.exitCode = 1;
    return;
  }

  let input: unknown;
  try {
    input = await readJson(path);
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }

  const db = createDb(url);
  try {
    // importContent validates the whole file before writing anything.
    const counts = await importContent(db, input as ImportInput);
    console.log(
      `Imported ${counts.experience} positions, ${counts.skillCategories} skill categories with ${counts.skills} skills, and ${counts.projects} projects.`,
    );
  } catch (error) {
    if (error instanceof ContentValidationError) {
      console.error("The file has invalid content; nothing was changed:");
      for (const issue of error.issues) {
        console.error(`  ${issue.field}: ${issue.code} (${issue.message})`);
      }
    } else {
      console.error(
        "Import failed:",
        error instanceof Error ? error.message : error,
      );
    }
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

await main();
