import type { Database } from "./db";
import { contact, contentState, profile, profileValues } from "./schema";
import { SEED_CONTACT, SEED_PROFILE, SEED_VALUES } from "./seed-data";

const SINGLETON_ID = 1;

/**
 * Loads the approved content into a new database. The profile row is the
 * marker: if it already exists, nothing is inserted or overwritten, so an
 * administrator's edits survive a second run (FR-025, FR-026).
 */
export async function seedContent(db: Database): Promise<{ applied: boolean }> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(profile)
      .values({
        id: SINGLETON_ID,
        name: SEED_PROFILE.name,
        titleEn: SEED_PROFILE.title.en,
        titleEs: SEED_PROFILE.title.es,
        sloganEn: SEED_PROFILE.slogan.en,
        sloganEs: SEED_PROFILE.slogan.es,
        headlineEn: SEED_PROFILE.headline.en,
        headlineEs: SEED_PROFILE.headline.es,
        summaryEn: SEED_PROFILE.summary.en,
        summaryEs: SEED_PROFILE.summary.es,
        missionEn: SEED_PROFILE.mission.en,
        missionEs: SEED_PROFILE.mission.es,
        visionEn: SEED_PROFILE.vision.en,
        visionEs: SEED_PROFILE.vision.es,
      })
      .onConflictDoNothing()
      .returning({ id: profile.id });
    if (inserted.length === 0) {
      return { applied: false };
    }

    await tx.insert(profileValues).values(
      SEED_VALUES.map((value, position) => ({
        titleEn: value.title.en,
        titleEs: value.title.es,
        descriptionEn: value.description.en,
        descriptionEs: value.description.es,
        position,
      })),
    );
    await tx
      .insert(contact)
      .values({ id: SINGLETON_ID, ...SEED_CONTACT })
      .onConflictDoNothing();
    await tx
      .insert(contentState)
      .values({ id: SINGLETON_ID })
      .onConflictDoNothing();
    return { applied: true };
  });
}
