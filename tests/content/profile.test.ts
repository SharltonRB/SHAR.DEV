import { beforeEach, describe, expect, it } from "vitest";
import {
  type ContactInput,
  ContentNotFoundError,
  createValue,
  type Database,
  deleteValue,
  getEditableContent,
  getPublishedContent,
  type ProfileInput,
  reorderValues,
  seedContent,
  updateContact,
  updateProfile,
  updateValue,
} from "../../src/content";
import { SEED_CONTACT, SEED_PROFILE } from "../../src/content/seed-data";
import { rejectedFields } from "../helpers/content";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await seedContent(db);
});

function profileWith(overrides: Partial<ProfileInput>): ProfileInput {
  return { ...SEED_PROFILE, ...overrides };
}

function contactWith(overrides: Partial<ContactInput>): ContactInput {
  return { ...SEED_CONTACT, ...overrides };
}

async function valueTitles() {
  return (await getPublishedContent(db, "en")).values.map((v) => v.title);
}

const testValue = (title: string) => ({
  title: { en: title },
  description: { en: `Description of ${title}.` },
});

describe("profile and values (US4)", () => {
  it("US4-1 changing only the Spanish summary changes es and keeps en", async () => {
    await updateProfile(
      db,
      profileWith({
        summary: { en: SEED_PROFILE.summary.en, es: "Resumen de prueba." },
      }),
    );

    expect((await getPublishedContent(db, "es")).profile.summary).toBe(
      "Resumen de prueba.",
    );
    expect((await getPublishedContent(db, "en")).profile.summary).toBe(
      SEED_PROFILE.summary.en,
    );
  });

  it("US4-2 an empty required English text is rejected naming the field", async () => {
    expect(
      await rejectedFields(
        updateProfile(
          db,
          profileWith({ mission: { en: " ", es: "Misión." }, name: "" }),
        ),
      ),
    ).toEqual([
      { field: "name", code: "required" },
      { field: "mission.en", code: "required" },
    ]);
    expect((await getEditableContent(db)).profile).toEqual(SEED_PROFILE);
  });

  it("US4-3 FR-008 values can be reordered, added and deleted, within 1 to 6", async () => {
    const ids = (await getEditableContent(db)).values.map((v) => v.id);
    await reorderValues(db, [...ids].reverse());
    expect(await valueTitles()).toEqual([
      "Continuous learning",
      "Clear communication",
      "Technical rigor",
      "Autonomy",
    ]);

    await createValue(db, testValue("Test Value 5"));
    await createValue(db, testValue("Test Value 6"));
    expect(
      await rejectedFields(createValue(db, testValue("Test Value 7"))),
    ).toEqual([{ field: "values", code: "too_many" }]);
    expect(await valueTitles()).toHaveLength(6);

    const all = (await getEditableContent(db)).values.map((v) => v.id);
    for (const id of all.slice(1)) {
      await deleteValue(db, id);
    }
    expect(await rejectedFields(deleteValue(db, all[0] as number))).toEqual([
      { field: "values", code: "too_few" },
    ]);
    expect(await valueTitles()).toEqual(["Continuous learning"]);
  });

  it("FR-018 a new value goes to the end", async () => {
    await createValue(db, testValue("Test Value"));
    expect((await valueTitles()).at(-1)).toBe("Test Value");
  });

  it("updateValue replaces a value; missing ids give ContentNotFoundError", async () => {
    const [first] = (await getEditableContent(db)).values;
    await updateValue(db, first?.id as number, {
      title: { en: "Test Title", es: "Título de prueba" },
      description: { en: "Test description." },
    });
    expect((await getPublishedContent(db, "es")).values[0]).toMatchObject({
      title: "Título de prueba",
      description: "Test description.",
    });

    await expect(
      updateValue(db, 9999, testValue("Test Value")),
    ).rejects.toEqual(new ContentNotFoundError("value", 9999));
    await expect(deleteValue(db, 9999)).rejects.toEqual(
      new ContentNotFoundError("value", 9999),
    );
  });

  it("FR-007 the headline is optional: empty gives null, set gives its language, Spanish only is rejected", async () => {
    await updateProfile(db, profileWith({ headline: { en: "", es: " " } }));
    expect((await getPublishedContent(db, "en")).profile.headline).toBeNull();

    await updateProfile(
      db,
      profileWith({
        headline: { en: "Test headline", es: "Titular de prueba" },
      }),
    );
    expect((await getPublishedContent(db, "en")).profile.headline).toBe(
      "Test headline",
    );
    expect((await getPublishedContent(db, "es")).profile.headline).toBe(
      "Titular de prueba",
    );

    expect(
      await rejectedFields(
        updateProfile(db, profileWith({ headline: { es: "Solo español" } })),
      ),
    ).toEqual([{ field: "headline.en", code: "required" }]);
  });

  it("US5-2 seeding again does not overwrite an edited profile", async () => {
    await updateProfile(db, profileWith({ slogan: { en: "Test slogan." } }));
    const edited = await getEditableContent(db);

    await expect(seedContent(db)).resolves.toEqual({ applied: false });

    expect(await getEditableContent(db)).toEqual(edited);
    expect(edited.profile.slogan).toEqual({ en: "Test slogan.", es: null });
  });
});

describe("contact (US4)", () => {
  it("US4-4 rejects an invalid email, WhatsApp and link naming each field", async () => {
    expect(
      await rejectedFields(
        updateContact(
          db,
          contactWith({
            email: "not-an-email",
            whatsapp: "50670429481",
            linkedinUrl: "http://linkedin.com/in/test",
          }),
        ),
      ),
    ).toEqual([
      { field: "email", code: "invalid_email" },
      { field: "whatsapp", code: "invalid_phone" },
      { field: "linkedinUrl", code: "invalid_url" },
    ]);

    for (const phone of ["+1234567", "+1234567890123456"]) {
      expect(
        await rejectedFields(
          updateContact(db, contactWith({ whatsapp: phone })),
        ),
      ).toEqual([{ field: "whatsapp", code: "invalid_phone" }]);
    }
    expect((await getEditableContent(db)).contact).toEqual(SEED_CONTACT);
  });

  it("FR-016 empty LinkedIn and GitHub are accepted as null; set ones are published", async () => {
    await updateContact(db, contactWith({ linkedinUrl: "", githubUrl: null }));
    expect((await getPublishedContent(db, "en")).contact).toMatchObject({
      linkedinUrl: null,
      githubUrl: null,
    });

    await updateContact(
      db,
      contactWith({
        email: "test@example.com",
        githubUrl: "https://github.com/test",
      }),
    );
    expect((await getPublishedContent(db, "es")).contact).toEqual({
      ...SEED_CONTACT,
      email: "test@example.com",
      githubUrl: "https://github.com/test",
    });
  });
});
