import { beforeEach, describe, expect, it } from "vitest";
import {
  ContentNotFoundError,
  createProject,
  type Database,
  deleteProject,
  getContentLastModified,
  getEditableContent,
  getPublishedContent,
  type ProjectInput,
  reorderProjects,
  seedContent,
  setProjectStatus,
  updateProject,
} from "../../src/content";
import { rejectedFields, tick } from "../helpers/content";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await seedContent(db);
});

function project(name: string): ProjectInput {
  return {
    title: { en: `Test Project ${name}` },
    description: { en: `Description of test project ${name}.` },
    technologies: ["Java"],
  };
}

async function editableProjects() {
  return (await getEditableContent(db)).projects;
}

async function titles() {
  return (await editableProjects()).map((p) => p.title.en);
}

describe("projects (US2)", () => {
  it("US2-1 a new project is a draft at the end of the list", async () => {
    await createProject(db, project("A"));
    const { id } = await createProject(db, project("B"));

    const projects = await editableProjects();
    expect(projects.map((p) => p.id).at(-1)).toBe(id);
    expect(projects.at(-1)?.status).toBe("draft");
    expect((await getPublishedContent(db, "en")).projects).toEqual([]);
  });

  it("US2-2 a published project appears in en and es", async () => {
    const { id } = await createProject(db, {
      ...project("A"),
      title: { en: "Test Project A", es: "Proyecto de prueba A" },
    });
    await setProjectStatus(db, id, "published");

    const en = await getPublishedContent(db, "en");
    const es = await getPublishedContent(db, "es");
    expect(en.projects.map((p) => p.title)).toEqual(["Test Project A"]);
    expect(es.projects.map((p) => p.title)).toEqual(["Proyecto de prueba A"]);
  });

  it("US2-3 a new order with all three projects is applied", async () => {
    const a = await createProject(db, project("A"));
    const b = await createProject(db, project("B"));
    const c = await createProject(db, project("C"));

    await reorderProjects(db, [c.id, a.id, b.id]);

    expect(await titles()).toEqual([
      "Test Project C",
      "Test Project A",
      "Test Project B",
    ]);
  });

  it("US2-4 rejects an order that omits, repeats or adds a project, without changes", async () => {
    const a = await createProject(db, project("A"));
    const b = await createProject(db, project("B"));
    const c = await createProject(db, project("C"));
    const before = await titles();

    for (const ids of [
      [a.id, b.id],
      [a.id, b.id, b.id],
      [a.id, b.id, c.id, 9999],
    ]) {
      expect(await rejectedFields(reorderProjects(db, ids))).toEqual([
        { field: "ids", code: "invalid_order" },
      ]);
    }
    expect(await titles()).toEqual(before);
  });

  it("US2-5 rejects an http:// or invalid link naming the field", async () => {
    expect(
      await rejectedFields(
        createProject(db, {
          ...project("A"),
          demoUrl: "http://example.com",
          codeUrl: "not a url",
        }),
      ),
    ).toEqual([
      { field: "demoUrl", code: "invalid_url" },
      { field: "codeUrl", code: "invalid_url" },
    ]);
    expect(await editableProjects()).toEqual([]);
  });

  it("US2-6 deleting a project keeps the relative order of the rest", async () => {
    const a = await createProject(db, project("A"));
    const b = await createProject(db, project("B"));
    const c = await createProject(db, project("C"));
    await reorderProjects(db, [c.id, b.id, a.id]);

    await deleteProject(db, b.id);

    expect(await titles()).toEqual(["Test Project C", "Test Project A"]);
  });

  it("US2-7 rejects a project without English title, description or technologies", async () => {
    expect(
      await rejectedFields(
        createProject(db, {
          title: { en: "  ", es: "Solo español" },
          description: { en: "" },
          technologies: [],
        }),
      ),
    ).toEqual([
      { field: "title.en", code: "required" },
      { field: "description.en", code: "required" },
      { field: "technologies", code: "too_few" },
    ]);
  });

  it("FR-019 reports a missing alt text together with a missing field", async () => {
    const { title: _, ...withoutTitle } = project("A");
    expect(
      await rejectedFields(
        createProject(db, {
          ...withoutTitle,
          imageUrl: "https://example.com/a.png",
        } as ProjectInput),
      ),
    ).toEqual([
      { field: "title", code: "required" },
      { field: "imageAlt.en", code: "required" },
    ]);
  });

  it("FR-014 rejects an image without English alt text", async () => {
    expect(
      await rejectedFields(
        createProject(db, {
          ...project("A"),
          imageUrl: "https://example.com/a.png",
        }),
      ),
    ).toEqual([{ field: "imageAlt.en", code: "required" }]);
  });

  it("FR-014 accepts a project without demo or code links", async () => {
    const { id } = await createProject(db, project("A"));
    await setProjectStatus(db, id, "published");

    const [published] = (await getPublishedContent(db, "en")).projects;
    expect(published).toMatchObject({
      demoUrl: null,
      codeUrl: null,
      image: null,
    });
  });

  it("updating keeps the status and position", async () => {
    const a = await createProject(db, project("A"));
    await createProject(db, project("B"));
    await setProjectStatus(db, a.id, "published");

    await updateProject(db, a.id, project("A2"));

    const [first] = await editableProjects();
    expect(first).toMatchObject({
      id: a.id,
      status: "published",
      title: { en: "Test Project A2" },
    });
  });

  it("editing, publishing or deleting a missing id gives ContentNotFoundError without effects", async () => {
    await createProject(db, project("A"));
    const before = await getEditableContent(db);
    const lastModified = await getContentLastModified(db);

    for (const write of [
      updateProject(db, 9999, project("X")),
      setProjectStatus(db, 9999, "published"),
      deleteProject(db, 9999),
    ]) {
      await expect(write).rejects.toEqual(
        new ContentNotFoundError("project", 9999),
      );
    }
    expect(await getEditableContent(db)).toEqual(before);
    expect(await getContentLastModified(db)).toEqual(lastModified);
  });

  it("FR-023 the last modified date moves on a successful write only", async () => {
    const before = await getContentLastModified(db);
    await tick();
    await createProject(db, project("A"));
    const afterWrite = await getContentLastModified(db);
    expect(afterWrite.getTime()).toBeGreaterThan(before.getTime());

    await tick();
    await rejectedFields(
      createProject(db, { ...project("B"), technologies: [] }),
    );
    expect(await getContentLastModified(db)).toEqual(afterWrite);
  });

  it("getEditableContent returns a draft with its status and both languages", async () => {
    await createProject(db, {
      ...project("A"),
      title: { en: "Test Project A", es: "Proyecto de prueba A" },
    });

    const [draft] = await editableProjects();
    expect(draft).toMatchObject({
      status: "draft",
      title: { en: "Test Project A", es: "Proyecto de prueba A" },
      description: { en: "Description of test project A.", es: null },
      imageAlt: { en: null, es: null },
    });
  });
});
