import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ContentNotFoundError,
  createExperience,
  type Database,
  deleteExperience,
  type ExperienceInput,
  getContentLastModified,
  getEditableContent,
  getPublishedContent,
  reorderExperience,
  seedContent,
  updateExperience,
} from "../../src/content";
import { rejectedFields, tick } from "../helpers/content";
import { createTestDb } from "../helpers/test-db";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
  await seedContent(db);
});

afterEach(() => {
  vi.useRealTimers();
});

function position(
  company: string,
  overrides: Partial<ExperienceInput> = {},
): ExperienceInput {
  return {
    company,
    role: { en: "Test Engineer", es: "Ingeniero de prueba" },
    startMonth: "2023-01",
    endMonth: "2024-06",
    location: { en: "Remote", es: "Remoto" },
    achievements: [{ en: "Did a test thing.", es: "Hizo algo de prueba." }],
    technologies: ["Java"],
    ...overrides,
  };
}

async function companies() {
  return (await getPublishedContent(db, "en")).experience.map((e) => e.company);
}

describe("experience (US3)", () => {
  it("US3-1 a position without end date is current: Present / Presente", async () => {
    await createExperience(
      db,
      position("Test Company", { startMonth: "2024-03", endMonth: null }),
    );

    const [en] = (await getPublishedContent(db, "en")).experience;
    const [es] = (await getPublishedContent(db, "es")).experience;
    expect(en).toMatchObject({
      company: "Test Company",
      startMonth: "2024-03",
      endMonth: null,
      endLabel: "Present",
    });
    expect(es).toMatchObject({ endMonth: null, endLabel: "Presente" });
  });

  it("a past position has its end month and no label", async () => {
    await createExperience(db, position("Test Company"));

    const [en] = (await getPublishedContent(db, "en")).experience;
    expect(en).toMatchObject({ endMonth: "2024-06", endLabel: null });
  });

  it("US3-2 rejects an end month before the start month", async () => {
    expect(
      await rejectedFields(
        createExperience(
          db,
          position("Test Company", {
            startMonth: "2024-05",
            endMonth: "2024-04",
          }),
        ),
      ),
    ).toEqual([{ field: "endMonth", code: "invalid_date_range" }]);
  });

  it("US3-3 rejects 0 and 6 achievements", async () => {
    const achievement = { en: "Did a test thing." };
    expect(
      await rejectedFields(
        createExperience(db, position("Test Company", { achievements: [] })),
      ),
    ).toEqual([{ field: "achievements", code: "too_few" }]);
    expect(
      await rejectedFields(
        createExperience(
          db,
          position("Test Company", {
            achievements: Array.from({ length: 6 }, () => achievement),
          }),
        ),
      ),
    ).toEqual([{ field: "achievements", code: "too_many" }]);
    expect(await companies()).toEqual([]);
  });

  it("FR-010 rejects a future start or end month", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

    expect(
      await rejectedFields(
        createExperience(
          db,
          position("Test Company", { startMonth: "2026-07", endMonth: null }),
        ),
      ),
    ).toEqual([{ field: "startMonth", code: "future_date" }]);
    expect(
      await rejectedFields(
        createExperience(
          db,
          position("Test Company", {
            startMonth: "2026-01",
            endMonth: "2026-07",
          }),
        ),
      ),
    ).toEqual([{ field: "endMonth", code: "future_date" }]);
    await expect(
      createExperience(
        db,
        position("Test Company", { startMonth: "2026-06", endMonth: null }),
      ),
    ).resolves.toBeDefined();
  });

  it("returns a current and a past position in the administrator's order, not by date", async () => {
    const past = await createExperience(db, position("Past Company"));
    const current = await createExperience(
      db,
      position("Current Company", { startMonth: "2025-01", endMonth: null }),
    );
    expect(await companies()).toEqual(["Past Company", "Current Company"]);

    await reorderExperience(db, [current.id, past.id]);
    expect(await companies()).toEqual(["Current Company", "Past Company"]);
  });

  it("rejects an order with an id from another list", async () => {
    const a = await createExperience(db, position("Company A"));
    expect(await rejectedFields(reorderExperience(db, [a.id, 9999]))).toEqual([
      { field: "ids", code: "invalid_order" },
    ]);
  });

  it("FR-018 a new position goes to the end", async () => {
    await createExperience(db, position("Company A"));
    await createExperience(db, position("Company B"));
    const { id } = await createExperience(db, position("Company C"));

    const items = (await getEditableContent(db)).experience;
    expect(items.at(-1)?.id).toBe(id);
    expect(await companies()).toEqual(["Company A", "Company B", "Company C"]);
  });

  it("FR-002 achievements without Spanish fall back to English", async () => {
    await createExperience(
      db,
      position("Test Company", {
        achievements: [
          { en: "First test thing.", es: "Primera cosa de prueba." },
          { en: "Second test thing." },
        ],
      }),
    );

    const [es] = (await getPublishedContent(db, "es")).experience;
    expect(es?.achievements).toEqual([
      "Primera cosa de prueba.",
      "Second test thing.",
    ]);
  });

  it("update replaces the content and delete removes it", async () => {
    const { id } = await createExperience(db, position("Company A"));
    await updateExperience(db, id, position("Company A2"));
    expect(await companies()).toEqual(["Company A2"]);

    await deleteExperience(db, id);
    expect(await companies()).toEqual([]);
    await expect(deleteExperience(db, id)).rejects.toEqual(
      new ContentNotFoundError("experience", id),
    );
    await expect(
      updateExperience(db, id, position("Company A3")),
    ).rejects.toEqual(new ContentNotFoundError("experience", id));
  });

  it("US3-2 an end month equal to the start month is accepted", async () => {
    await createExperience(
      db,
      position("Test Company", { startMonth: "2024-05", endMonth: "2024-05" }),
    );
    expect(await companies()).toEqual(["Test Company"]);
  });

  it("FR-019 reports the date range together with a missing field", async () => {
    const { company: _, ...withoutCompany } = position("Test Company", {
      startMonth: "2024-05",
      endMonth: "2024-01",
    });
    expect(
      await rejectedFields(
        createExperience(db, withoutCompany as ExperienceInput),
      ),
    ).toEqual([
      { field: "company", code: "required" },
      { field: "endMonth", code: "invalid_date_range" },
    ]);
  });

  it("an invalid start month gives one issue, without a date range issue", async () => {
    expect(
      await rejectedFields(
        createExperience(
          db,
          position("Test Company", { startMonth: "zzz", endMonth: "2024-01" }),
        ),
      ),
    ).toEqual([{ field: "startMonth", code: "invalid_date" }]);
  });

  it("FR-023 the last modified date moves on a successful write only", async () => {
    const before = await getContentLastModified(db);
    await tick();
    const { id } = await createExperience(db, position("Test Company"));
    const afterWrite = await getContentLastModified(db);
    expect(afterWrite.getTime()).toBeGreaterThan(before.getTime());

    await tick();
    await rejectedFields(
      updateExperience(db, id, position("Test Company", { achievements: [] })),
    );
    await expect(deleteExperience(db, 9999)).rejects.toBeInstanceOf(
      ContentNotFoundError,
    );
    expect(await getContentLastModified(db)).toEqual(afterWrite);
  });
});
