import { beforeEach, describe, expect, it } from "vitest";
import {
  ContentNotFoundError,
  createSkill,
  createSkillCategory,
  type Database,
  deleteSkill,
  deleteSkillCategory,
  getEditableContent,
  getPublishedContent,
  reorderSkillCategories,
  reorderSkills,
  type SkillInput,
  seedContent,
  updateSkill,
  updateSkillCategory,
} from "../../src/content";
import { rejectedFields } from "../helpers/content";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await seedContent(db);
});

async function category(en: string, es?: string) {
  return (await createSkillCategory(db, { name: { en, es } })).id;
}

async function published(locale: "en" | "es" = "en") {
  return (await getPublishedContent(db, locale)).skillCategories.map((c) => ({
    name: c.name,
    skills: c.skills.map((s) => s.name),
  }));
}

describe("skills (US3)", () => {
  it("FR-011 categories are published in order with their skills, in each language", async () => {
    const backend = await category("Test Backend", "Backend de prueba");
    const tools = await category("Test Tools");
    await createSkill(db, backend, { name: "Java" });
    await createSkill(db, backend, { name: "Spring Boot" });
    await createSkill(db, tools, { name: "Docker" });

    expect(await published("en")).toEqual([
      { name: "Test Backend", skills: ["Java", "Spring Boot"] },
      { name: "Test Tools", skills: ["Docker"] },
    ]);
    expect(await published("es")).toEqual([
      { name: "Backend de prueba", skills: ["Java", "Spring Boot"] },
      { name: "Test Tools", skills: ["Docker"] },
    ]);

    await reorderSkillCategories(db, [tools, backend]);
    expect((await published()).map((c) => c.name)).toEqual([
      "Test Tools",
      "Test Backend",
    ]);
  });

  it("US3-4 a new order of skills within a category is published", async () => {
    const id = await category("Test Backend");
    const java = await createSkill(db, id, { name: "Java" });
    const sql = await createSkill(db, id, { name: "SQL" });
    const kafka = await createSkill(db, id, { name: "Kafka" });

    await reorderSkills(db, id, [kafka.id, java.id, sql.id]);

    expect(await published()).toEqual([
      { name: "Test Backend", skills: ["Kafka", "Java", "SQL"] },
    ]);
  });

  it("US3-5 deleting a category with skills is rejected; an empty one is deleted", async () => {
    const full = await category("Test Full");
    const empty = await category("Test Empty");
    await createSkill(db, full, { name: "Java" });

    expect(await rejectedFields(deleteSkillCategory(db, full))).toEqual([
      { field: "skills", code: "not_empty" },
    ]);
    await deleteSkillCategory(db, empty);

    expect(await published()).toEqual([
      { name: "Test Full", skills: ["Java"] },
    ]);
  });

  it("US3-6 FR-012 a skill with level, percentage or years is rejected and not saved", async () => {
    const id = await category("Test Backend");

    for (const extra of [{ level: 5 }, { percentage: 90 }, { years: 3 }]) {
      const input = { name: "Java", ...extra } as SkillInput;
      const [field] = Object.keys(extra);
      expect(await rejectedFields(createSkill(db, id, input))).toEqual([
        { field, code: "unknown_field" },
      ]);
    }

    const [published] = (await getPublishedContent(db, "en")).skillCategories;
    expect(published?.skills).toEqual([]);
  });

  it("US3-7 a repeated name ignoring case is rejected in the same category, accepted in another", async () => {
    const backend = await category("Test Backend");
    const tools = await category("Test Tools");
    await createSkill(db, backend, { name: "Java" });

    expect(
      await rejectedFields(createSkill(db, backend, { name: "java" })),
    ).toEqual([{ field: "name", code: "duplicate" }]);
    await expect(
      createSkill(db, tools, { name: "java" }),
    ).resolves.toBeDefined();
  });

  it("renaming a skill to a name already in its category is rejected; to its own name, accepted", async () => {
    const id = await category("Test Backend");
    await createSkill(db, id, { name: "Java" });
    const sql = await createSkill(db, id, { name: "SQL" });

    expect(
      await rejectedFields(updateSkill(db, sql.id, { name: "JAVA" })),
    ).toEqual([{ field: "name", code: "duplicate" }]);
    await updateSkill(db, sql.id, { name: "sql" });
    expect((await published())[0]?.skills).toEqual(["Java", "sql"]);
  });

  it("reorderSkills rejects a skill from another category", async () => {
    const backend = await category("Test Backend");
    const tools = await category("Test Tools");
    const java = await createSkill(db, backend, { name: "Java" });
    const docker = await createSkill(db, tools, { name: "Docker" });

    expect(
      await rejectedFields(reorderSkills(db, backend, [java.id, docker.id])),
    ).toEqual([{ field: "ids", code: "invalid_order" }]);
  });

  it("FR-018 a new category goes to the end, and a new skill to the end of its category", async () => {
    const first = await category("Test First");
    const last = await category("Test Last");
    await createSkill(db, first, { name: "Java" });
    const sql = await createSkill(db, first, { name: "SQL" });

    const content = await getEditableContent(db);
    expect(content.skillCategories.map((c) => c.id)).toEqual([first, last]);
    expect(content.skillCategories[0]?.skills.at(-1)?.id).toBe(sql.id);
  });

  it("createSkill in a missing category gives ContentNotFoundError", async () => {
    await expect(createSkill(db, 9999, { name: "Java" })).rejects.toEqual(
      new ContentNotFoundError("skillCategory", 9999),
    );
  });

  it("update and delete work, and missing ids give ContentNotFoundError", async () => {
    const id = await category("Test Backend");
    const java = await createSkill(db, id, { name: "Java" });
    await updateSkillCategory(db, id, { name: { en: "Test Server" } });
    await deleteSkill(db, java.id);

    expect(await published()).toEqual([{ name: "Test Server", skills: [] }]);
    await expect(deleteSkill(db, java.id)).rejects.toEqual(
      new ContentNotFoundError("skill", java.id),
    );
    await expect(
      updateSkillCategory(db, 9999, { name: { en: "X" } }),
    ).rejects.toEqual(new ContentNotFoundError("skillCategory", 9999));
  });
});
