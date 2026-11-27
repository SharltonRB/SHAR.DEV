import { beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getContentLastModified,
  getEditableContent,
  seedContent,
} from "../../src/content";
import {
  SEED_CONTACT,
  SEED_PROFILE,
  SEED_VALUES,
} from "../../src/content/seed-data";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("database setup (US5)", () => {
  it("FR-024 seeds a database created only from the migrations", async () => {
    await expect(seedContent(db)).resolves.toEqual({ applied: true });
    const content = await getEditableContent(db);
    expect(content.values).toHaveLength(4);
    await expect(getContentLastModified(db)).resolves.toBeInstanceOf(Date);
  });

  it("getEditableContent rejects an unseeded database with a clear message", async () => {
    await expect(getEditableContent(db)).rejects.toThrow(/pnpm db:setup/);
  });

  it("US5-1 loads the approved profile, values and contact", async () => {
    await seedContent(db);
    const content = await getEditableContent(db);

    expect(content.profile).toEqual(SEED_PROFILE);
    expect(
      content.values.map(({ title, description }) => ({ title, description })),
    ).toEqual(SEED_VALUES);
    expect(content.values.map((value) => value.position)).toEqual([0, 1, 2, 3]);
    expect(content.contact).toEqual(SEED_CONTACT);

    // SC-001 control: texts typed by hand from the approved source, so a
    // typo copied into seed-data.ts would not pass unnoticed.
    expect(content.profile.mission.en).toBe(
      "To build secure, reliable and well-documented backend systems that turn complex business logic into services teams and users can trust — one endpoint at a time.",
    );
    expect(content.values[0]?.title.es).toBe("Autonomía");
    expect(content.values[0]?.description.es).toBe(
      "asumo la responsabilidad desde el diseño hasta producción.",
    );
    expect(content.profile.title).toEqual({
      en: "Java Backend Engineer",
      es: null,
    });
    expect(content.profile.headline).toEqual({ en: null, es: null });
  });

  it("US5-3 leaves experience, skills and projects empty", async () => {
    await seedContent(db);
    const content = await getEditableContent(db);

    expect(content.experience).toEqual([]);
    expect(content.skillCategories).toEqual([]);
    expect(content.projects).toEqual([]);
  });

  it("SC-005 FR-026 seeding twice leaves the same content as seeding once", async () => {
    await seedContent(db);
    const once = await getEditableContent(db);
    const modifiedOnce = await getContentLastModified(db);

    await expect(seedContent(db)).resolves.toEqual({ applied: false });
    const twice = await getEditableContent(db);

    expect(twice).toEqual(once);
    await expect(getContentLastModified(db)).resolves.toEqual(modifiedOnce);
    expect(twice.values).toHaveLength(4);
  });
});
