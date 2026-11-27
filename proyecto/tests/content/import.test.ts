import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getContentLastModified,
  getEditableContent,
  getPublishedContent,
  type ImportInput,
  importContent,
  seedContent,
} from "../../src/content";
import { rejectedFields, tick } from "../helpers/content";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await seedContent(db);
});

function testFile(): ImportInput {
  return {
    experience: [
      {
        company: "Test Company A",
        role: { en: "Test Engineer", es: "Ingeniero de prueba" },
        startMonth: "2024-01",
        endMonth: null,
        location: { en: "Remote", es: "Remoto" },
        achievements: [{ en: "Did a test thing." }],
        technologies: ["Java"],
      },
      {
        company: "Test Company B",
        role: { en: "Test Intern" },
        startMonth: "2022-01",
        endMonth: "2023-06",
        location: { en: "Test City" },
        achievements: [{ en: "Learned a test thing." }],
        technologies: ["SQL"],
      },
    ],
    skillCategories: [
      { name: { en: "Test Backend" }, skills: ["Java", "Spring Boot"] },
      { name: { en: "Test Tools", es: "Herramientas" }, skills: ["Docker"] },
    ],
    projects: [
      {
        title: { en: "Test Project 1" },
        description: { en: "First." },
        technologies: ["Java"],
        status: "published",
      },
      {
        title: { en: "Test Project 2" },
        description: { en: "Second." },
        technologies: ["Java"],
      },
      {
        title: { en: "Test Project 3" },
        description: { en: "Third." },
        technologies: ["Java"],
        status: "published",
      },
    ],
  };
}

/** The editable content without ids, which each import creates anew. */
function withoutIds(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withoutIds);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "id")
        .map(([key, item]) => [key, withoutIds(item)]),
    );
  }
  return value;
}

describe("importContent (US6)", () => {
  it("FR-019 reports a duplicate skill together with a missing category name", async () => {
    const file = testFile();
    file.skillCategories = [{ skills: ["Java", "java"] } as never];

    expect(await rejectedFields(importContent(db, file))).toEqual([
      { field: "skillCategories.0.name", code: "required" },
      { field: "skillCategories.0.skills.1", code: "duplicate" },
    ]);
  });

  it("the example template scripts/portfolio.example.json is valid", async () => {
    const template = JSON.parse(
      readFileSync(
        new URL("../../scripts/portfolio.example.json", import.meta.url),
        "utf8",
      ),
    );

    await expect(importContent(db, template)).resolves.toEqual({
      experience: 2,
      skillCategories: 2,
      skills: 3,
      projects: 2,
    });
  });

  it("US6-1 loads the file in its order; a project without status is a draft", async () => {
    await expect(importContent(db, testFile())).resolves.toEqual({
      experience: 2,
      skillCategories: 2,
      skills: 3,
      projects: 3,
    });

    const editable = await getEditableContent(db);
    expect(editable.experience.map((e) => e.company)).toEqual([
      "Test Company A",
      "Test Company B",
    ]);
    expect(
      editable.skillCategories.map((c) => [
        c.name.en,
        c.skills.map((s) => s.name),
      ]),
    ).toEqual([
      ["Test Backend", ["Java", "Spring Boot"]],
      ["Test Tools", ["Docker"]],
    ]);
    expect(editable.projects.map((p) => [p.title.en, p.status])).toEqual([
      ["Test Project 1", "published"],
      ["Test Project 2", "draft"],
      ["Test Project 3", "published"],
    ]);

    const published = await getPublishedContent(db, "en");
    expect(published.projects.map((p) => p.title)).toEqual([
      "Test Project 1",
      "Test Project 3",
    ]);
  });

  it("US6-2 reloading an edited file reflects it, without duplicates or leftovers", async () => {
    await importContent(db, testFile());
    const edited = testFile();
    edited.projects.splice(1, 1);
    const [first] = edited.experience;
    if (first) first.achievements = [{ en: "Did a changed test thing." }];

    await importContent(db, edited);

    const editable = await getEditableContent(db);
    expect(editable.projects.map((p) => p.title.en)).toEqual([
      "Test Project 1",
      "Test Project 3",
    ]);
    expect(editable.experience).toHaveLength(2);
    expect(editable.experience[0]?.achievements).toEqual([
      { en: "Did a changed test thing.", es: null },
    ]);
    expect(editable.skillCategories.flatMap((c) => c.skills)).toHaveLength(3);
  });

  it("US6-3 FR-028 rejects invalid elements with one issue each and changes nothing", async () => {
    await importContent(db, testFile());
    const before = await getEditableContent(db);
    const file = testFile();
    const [job] = file.experience;
    const project = file.projects[1];
    if (job) job.technologies = [];
    if (project) project.demoUrl = "http://example.com";

    expect(await rejectedFields(importContent(db, file))).toEqual([
      { field: "experience.0.technologies", code: "too_few" },
      { field: "projects.1.demoUrl", code: "invalid_url" },
    ]);
    expect(await getEditableContent(db)).toEqual(before);
  });

  it("rejects a repeated skill name ignoring case and an unknown status", async () => {
    const file = testFile();
    const [category] = file.skillCategories;
    const [project] = file.projects;
    if (category) category.skills = ["Java", "JAVA"];
    if (project) project.status = "archived" as "draft";

    expect(await rejectedFields(importContent(db, file))).toEqual([
      { field: "skillCategories.0.skills.1", code: "duplicate" },
      { field: "projects.0.status", code: "required" },
    ]);
  });

  it("US6-4 the profile, values and contact do not change", async () => {
    const before = await getEditableContent(db);

    await importContent(db, testFile());

    const after = await getEditableContent(db);
    expect(after.profile).toEqual(before.profile);
    expect(after.values).toEqual(before.values);
    expect(after.contact).toEqual(before.contact);
  });

  it("SC-008 loading the same file twice leaves the same content as once", async () => {
    await importContent(db, testFile());
    const once = await getEditableContent(db);

    await importContent(db, testFile());
    const twice = await getEditableContent(db);

    expect(withoutIds(twice)).toEqual(withoutIds(once));
  });

  it("FR-027 an empty list empties its section; a missing key is rejected", async () => {
    await importContent(db, testFile());

    await importContent(db, { ...testFile(), projects: [] });
    expect((await getEditableContent(db)).projects).toEqual([]);

    const { projects: _, ...withoutProjects } = testFile();
    expect(
      await rejectedFields(importContent(db, withoutProjects as ImportInput)),
    ).toEqual([{ field: "projects", code: "required" }]);
  });

  it("FR-023 a successful load moves the last modified date; a rejected one does not", async () => {
    const before = await getContentLastModified(db);
    await tick();
    await importContent(db, testFile());
    const afterLoad = await getContentLastModified(db);
    expect(afterLoad.getTime()).toBeGreaterThan(before.getTime());

    await tick();
    await rejectedFields(
      importContent(db, { ...testFile(), experience: [{} as never] }),
    );
    expect(await getContentLastModified(db)).toEqual(afterLoad);
  });
});
