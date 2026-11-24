import { beforeEach, describe, expect, it } from "vitest";
import {
  ContentValidationError,
  type Database,
  getPublishedContent,
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
  await seedContent(db);
});

describe("getPublishedContent (US1)", () => {
  it("US1-1 returns the profile, About, values and contact in English", async () => {
    const content = await getPublishedContent(db, "en");

    expect(content.locale).toBe("en");
    expect(content.profile).toEqual({
      name: SEED_PROFILE.name,
      title: SEED_PROFILE.title.en,
      slogan: SEED_PROFILE.slogan.en,
      headline: null,
      summary: SEED_PROFILE.summary.en,
      mission: SEED_PROFILE.mission.en,
      vision: SEED_PROFILE.vision.en,
    });
    expect(
      content.values.map(({ title, description }) => ({ title, description })),
    ).toEqual(
      SEED_VALUES.map((value) => ({
        title: value.title.en,
        description: value.description.en,
      })),
    );
    expect(content.contact).toEqual(SEED_CONTACT);
  });

  it("US1-2 FR-002 returns Spanish texts, with the English title as fallback", async () => {
    const content = await getPublishedContent(db, "es");

    expect(content.locale).toBe("es");
    expect(content.profile.slogan).toBe("Un endpoint a la vez.");
    expect(content.profile.summary).toBe(SEED_PROFILE.summary.es);
    expect(content.profile.mission).toBe(SEED_PROFILE.mission.es);
    expect(content.profile.vision).toBe(SEED_PROFILE.vision.es);
    expect(content.profile.title).toBe("Java Backend Engineer");
    expect(content.values.map((value) => value.title)).toEqual([
      "Autonomía",
      "Rigor técnico",
      "Comunicación clara",
      "Aprendizaje constante",
    ]);
  });

  it("US1-5 FR-003 rejects an unsupported locale naming the supported ones", async () => {
    const error = await getPublishedContent(db, "fr").catch((e) => e);

    expect(error).toBeInstanceOf(ContentValidationError);
    expect(error.issues).toEqual([
      expect.objectContaining({ field: "locale", code: "unsupported_locale" }),
    ]);
    expect(error.issues[0].message).toMatch(/en/);
    expect(error.issues[0].message).toMatch(/es/);
  });

  it("US1-6 FR-004 returns empty sections as [] and the rest complete", async () => {
    for (const locale of ["en", "es"]) {
      const content = await getPublishedContent(db, locale);

      expect(content.experience).toEqual([]);
      expect(content.skillCategories).toEqual([]);
      expect(content.projects).toEqual([]);
      expect(content.values).toHaveLength(4);
      expect(content.profile.summary).not.toBe("");
    }
  });

  it("FR-007 returns the headline as null when it has no text", async () => {
    await expect(getPublishedContent(db, "en")).resolves.toMatchObject({
      profile: { headline: null },
    });
    await expect(getPublishedContent(db, "es")).resolves.toMatchObject({
      profile: { headline: null },
    });
  });
});
