import { beforeEach, describe, expect, it } from "vitest";
import {
  createExperience,
  createProject,
  createSkill,
  createSkillCategory,
  createValue,
  type Database,
  deleteExperience,
  deleteProject,
  deleteSkill,
  deleteSkillCategory,
  deleteValue,
  type ExperienceInput,
  getContentLastModified,
  getEditableContent,
  getPublishedContent,
  importContent,
  type ProjectInput,
  reorderExperience,
  reorderProjects,
  reorderSkillCategories,
  reorderSkills,
  reorderValues,
  seedContent,
  setProjectStatus,
  updateContact,
  updateExperience,
  updateProfile,
  updateProject,
  updateSkill,
  updateSkillCategory,
  updateValue,
} from "../../src/content";
import { SEED_CONTACT, SEED_PROFILE } from "../../src/content/seed-data";
import { rejectedFields, tick } from "../helpers/content";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await seedContent(db);
});

const text = (length: number) => "a".repeat(length);

function project(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    title: { en: "Test Project" },
    description: { en: "Test description." },
    technologies: ["Java"],
    ...overrides,
  };
}

function job(overrides: Partial<ExperienceInput> = {}): ExperienceInput {
  return {
    company: "Test Company",
    role: { en: "Test Engineer" },
    startMonth: "2023-01",
    endMonth: "2024-01",
    location: { en: "Remote" },
    achievements: [{ en: "Did a test thing." }],
    technologies: ["Java"],
    ...overrides,
  };
}

describe("validation across the module", () => {
  it("FR-019 SC-004 several invalid fields give one issue each and save nothing", async () => {
    expect(
      await rejectedFields(
        createProject(db, {
          title: { en: "" },
          description: { en: text(301) },
          technologies: [""],
          demoUrl: "http://example.com",
          imageUrl: "https://example.com/a.png",
        }),
      ),
    ).toEqual([
      { field: "title.en", code: "required" },
      { field: "description.en", code: "too_long" },
      { field: "technologies.0", code: "required" },
      { field: "demoUrl", code: "invalid_url" },
      { field: "imageAlt.en", code: "required" },
    ]);
    expect((await getEditableContent(db)).projects).toEqual([]);
  });

  // [name, limit, write with a text of that length]
  const limits: [string, number, (value: string) => Promise<unknown>][] = [
    [
      "headline",
      120,
      (v) => updateProfile(db, { ...SEED_PROFILE, headline: { en: v } }),
    ],
    [
      "slogan",
      80,
      (v) => updateProfile(db, { ...SEED_PROFILE, slogan: { en: v } }),
    ],
    [
      "summary",
      1200,
      (v) => updateProfile(db, { ...SEED_PROFILE, summary: { en: v } }),
    ],
    [
      "mission",
      1200,
      (v) => updateProfile(db, { ...SEED_PROFILE, mission: { en: v } }),
    ],
    [
      "vision",
      1200,
      (v) => updateProfile(db, { ...SEED_PROFILE, vision: { en: v } }),
    ],
    [
      "project title",
      80,
      (v) => createProject(db, project({ title: { en: v } })),
    ],
    [
      "project description",
      300,
      (v) => createProject(db, project({ description: { en: v } })),
    ],
    [
      "image alt",
      150,
      (v) =>
        createProject(
          db,
          project({
            imageUrl: "https://example.com/a.png",
            imageAlt: { en: v },
          }),
        ),
    ],
    [
      "achievement",
      200,
      (v) => createExperience(db, job({ achievements: [{ en: v }] })),
    ],
    [
      "value title",
      80,
      (v) =>
        createValue(db, { title: { en: v }, description: { en: "Test." } }),
    ],
    [
      "value description",
      200,
      (v) => createValue(db, { title: { en: "Test" }, description: { en: v } }),
    ],
  ];

  it.each(limits)(
    "FR-021 %s accepts %i characters and rejects one more",
    async (_, limit, write) => {
      await expect(write(text(limit))).resolves.not.toThrow();
      const issues = await rejectedFields(write(text(limit + 1)));
      expect(issues.map((issue) => issue.code)).toEqual(["too_long"]);
    },
  );

  it("FR-021 an emoji counts as one character", async () => {
    await expect(
      createProject(db, project({ title: { en: "🚀".repeat(80) } })),
    ).resolves.toBeDefined();
    expect(
      await rejectedFields(
        createProject(db, project({ title: { en: "🚀".repeat(81) } })),
      ),
    ).toEqual([{ field: "title.en", code: "too_long" }]);
  });

  it("FR-022 accents, ñ, quotes, HTML and emoji are stored and returned unchanged", async () => {
    const special = `Añadir «comillas» "dobles" 'simples' <script>alert(1)</script> 🚀`;
    const { id } = await createProject(
      db,
      project({ title: { en: "Test Project", es: special } }),
    );
    await setProjectStatus(db, id, "published");

    const [published] = (await getPublishedContent(db, "es")).projects;
    expect(published?.title).toBe(special);
  });

  it("FR-002 SC-002 Spanish made of spaces falls back to English, never empty", async () => {
    const blank = "   ";
    const { id } = await createProject(
      db,
      project({ title: { en: "Test Project", es: blank } }),
    );
    await setProjectStatus(db, id, "published");
    await createValue(db, {
      title: { en: "Test Value", es: blank },
      description: { en: "Test description.", es: blank },
    });
    await createExperience(
      db,
      job({ role: { en: "Test Engineer", es: blank } }),
    );
    await createSkillCategory(db, { name: { en: "Test Category", es: blank } });

    const es = await getPublishedContent(db, "es");
    expect(es.projects[0]?.title).toBe("Test Project");
    expect(es.values.at(-1)).toMatchObject({
      title: "Test Value",
      description: "Test description.",
    });
    expect(es.experience[0]?.role).toBe("Test Engineer");
    expect(es.skillCategories[0]?.name).toBe("Test Category");
  });

  it("FR-001 technologies, skills, email, WhatsApp and URLs are the same in en and es", async () => {
    const { id } = await createProject(
      db,
      project({
        technologies: ["Java", "Spring Boot"],
        demoUrl: "https://example.com/demo",
      }),
    );
    await setProjectStatus(db, id, "published");
    await createExperience(db, job({ technologies: ["PostgreSQL"] }));
    const category = await createSkillCategory(db, {
      name: { en: "Test Category", es: "Categoría de prueba" },
    });
    await createSkill(db, category.id, { name: "Docker" });

    const en = await getPublishedContent(db, "en");
    const es = await getPublishedContent(db, "es");
    expect(es.projects[0]?.technologies).toEqual(en.projects[0]?.technologies);
    expect(es.projects[0]?.demoUrl).toBe(en.projects[0]?.demoUrl);
    expect(es.experience[0]?.technologies).toEqual(
      en.experience[0]?.technologies,
    );
    expect(es.skillCategories[0]?.skills).toEqual(
      en.skillCategories[0]?.skills,
    );
    expect(es.contact).toEqual(en.contact);
  });

  it("FR-023 every write moves the last modified date only when it succeeds", async () => {
    const projectId = (await createProject(db, project())).id;
    const jobId = (await createExperience(db, job())).id;
    const categoryId = (await createSkillCategory(db, { name: { en: "Cat" } }))
      .id;
    const skillId = (await createSkill(db, categoryId, { name: "Java" })).id;
    const emptyCategoryId = (
      await createSkillCategory(db, { name: { en: "Empty" } })
    ).id;
    const values = (await getEditableContent(db)).values.map((v) => v.id);
    const empty = { en: "" };

    // [name, successful write, rejected write]
    const writes: [string, () => Promise<unknown>, () => Promise<unknown>][] = [
      [
        "updateProfile",
        () => updateProfile(db, SEED_PROFILE),
        () => updateProfile(db, { ...SEED_PROFILE, name: "" }),
      ],
      [
        "updateContact",
        () => updateContact(db, SEED_CONTACT),
        () => updateContact(db, { ...SEED_CONTACT, email: "x" }),
      ],
      [
        "createValue",
        () => createValue(db, { title: { en: "T" }, description: { en: "D" } }),
        () => createValue(db, { title: empty, description: empty }),
      ],
      [
        "updateValue",
        () =>
          updateValue(db, values[0] as number, {
            title: { en: "T" },
            description: { en: "D" },
          }),
        () =>
          updateValue(db, values[0] as number, {
            title: empty,
            description: empty,
          }),
      ],
      [
        "reorderValues",
        async () =>
          reorderValues(
            db,
            (await getEditableContent(db)).values.map((v) => v.id),
          ),
        () => reorderValues(db, []),
      ],
      [
        "deleteValue",
        () => deleteValue(db, values[1] as number),
        () => deleteValue(db, 9999),
      ],
      [
        "createProject",
        () => createProject(db, project()),
        () => createProject(db, project({ technologies: [] })),
      ],
      [
        "updateProject",
        () => updateProject(db, projectId, project()),
        () => updateProject(db, 9999, project()),
      ],
      [
        "setProjectStatus",
        () => setProjectStatus(db, projectId, "published"),
        () => setProjectStatus(db, 9999, "published"),
      ],
      [
        "reorderProjects",
        async () =>
          reorderProjects(
            db,
            (await getEditableContent(db)).projects.map((p) => p.id),
          ),
        () => reorderProjects(db, [9999]),
      ],
      [
        "createExperience",
        () => createExperience(db, job()),
        () => createExperience(db, job({ achievements: [] })),
      ],
      [
        "updateExperience",
        () => updateExperience(db, jobId, job()),
        () => updateExperience(db, 9999, job()),
      ],
      [
        "reorderExperience",
        async () =>
          reorderExperience(
            db,
            (await getEditableContent(db)).experience.map((e) => e.id),
          ),
        () => reorderExperience(db, [9999]),
      ],
      [
        "createSkillCategory",
        () => createSkillCategory(db, { name: { en: "Other" } }),
        () => createSkillCategory(db, { name: empty }),
      ],
      [
        "updateSkillCategory",
        () => updateSkillCategory(db, categoryId, { name: { en: "Cat 2" } }),
        () => updateSkillCategory(db, 9999, { name: { en: "X" } }),
      ],
      [
        "reorderSkillCategories",
        async () =>
          reorderSkillCategories(
            db,
            (await getEditableContent(db)).skillCategories.map((c) => c.id),
          ),
        () => reorderSkillCategories(db, [9999]),
      ],
      [
        "createSkill",
        () => createSkill(db, categoryId, { name: "SQL" }),
        () => createSkill(db, categoryId, { name: "java" }),
      ],
      [
        "updateSkill",
        () => updateSkill(db, skillId, { name: "Java 25" }),
        () => updateSkill(db, 9999, { name: "X" }),
      ],
      [
        "reorderSkills",
        async () =>
          reorderSkills(
            db,
            categoryId,
            (await getEditableContent(db)).skillCategories
              .find((c) => c.id === categoryId)
              ?.skills.map((s) => s.id) ?? [],
          ),
        () => reorderSkills(db, categoryId, [9999]),
      ],
      [
        "deleteSkill",
        () => deleteSkill(db, skillId),
        () => deleteSkill(db, 9999),
      ],
      [
        "deleteSkillCategory",
        () => deleteSkillCategory(db, emptyCategoryId),
        () => deleteSkillCategory(db, categoryId),
      ],
      [
        "deleteExperience",
        () => deleteExperience(db, jobId),
        () => deleteExperience(db, 9999),
      ],
      [
        "deleteProject",
        () => deleteProject(db, projectId),
        () => deleteProject(db, 9999),
      ],
      [
        "importContent",
        () =>
          importContent(db, {
            experience: [],
            skillCategories: [],
            projects: [],
          }),
        () =>
          importContent(db, { experience: [], skillCategories: [] } as never),
      ],
    ];

    for (const [name, succeed, reject] of writes) {
      // The setup write for some cases moves the date, so read it after.
      const before = await getContentLastModified(db);
      await tick();
      await expect(reject(), name).rejects.toThrow();
      expect(await getContentLastModified(db), `${name} rejected`).toEqual(
        before,
      );
      await succeed();
      expect(
        (await getContentLastModified(db)).getTime(),
        `${name} succeeded`,
      ).toBeGreaterThan(before.getTime());
    }
  });
});
