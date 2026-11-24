import { asc } from "drizzle-orm";
import type { Database } from "./db";
import {
  type BilingualItem,
  contact,
  experience,
  profile,
  profileValues,
  projects,
  skillCategories,
  skills,
} from "./schema";

export type YearMonth = `${number}-${number}`;

/** Both languages as stored: English required, Spanish null when blank. */
export type BilingualText = BilingualItem;

/** Both languages optional, like the headline and the image alt text. */
export type OptionalBilingualText = { en: string | null; es: string | null };

export type EditableProfile = {
  name: string;
  title: BilingualText;
  slogan: BilingualText;
  headline: OptionalBilingualText;
  summary: BilingualText;
  mission: BilingualText;
  vision: BilingualText;
};

export type EditableValue = {
  id: number;
  position: number;
  title: BilingualText;
  description: BilingualText;
};

export type EditableExperience = {
  id: number;
  position: number;
  company: string;
  role: BilingualText;
  startMonth: YearMonth;
  endMonth: YearMonth | null;
  location: BilingualText;
  achievements: BilingualText[];
  technologies: string[];
};

export type EditableSkill = { id: number; position: number; name: string };

export type EditableSkillCategory = {
  id: number;
  position: number;
  name: BilingualText;
  skills: EditableSkill[];
};

export type EditableProject = {
  id: number;
  position: number;
  status: "draft" | "published";
  title: BilingualText;
  description: BilingualText;
  technologies: string[];
  demoUrl: string | null;
  codeUrl: string | null;
  imageUrl: string | null;
  imageAlt: OptionalBilingualText;
};

export type EditableContact = {
  email: string;
  whatsapp: string;
  linkedinUrl: string | null;
  githubUrl: string | null;
};

/**
 * Every content block with both languages unresolved, drafts included, in
 * the administrator's order (FR-017). Shapes mirror the write inputs.
 */
export type EditableContent = {
  profile: EditableProfile;
  values: EditableValue[];
  experience: EditableExperience[];
  skillCategories: EditableSkillCategory[];
  projects: EditableProject[];
  contact: EditableContact;
};

/** One consistent snapshot of every block, without taking write locks. */
const READ_SNAPSHOT = {
  isolationLevel: "repeatable read",
  accessMode: "read only",
} as const;

function bilingual<T extends string | null>(
  en: T,
  es: string | null,
): { en: T; es: string | null } {
  return { en, es };
}

/** A `date` column (`YYYY-MM-DD`) as the `YYYY-MM` month it stores. */
function toYearMonth(value: string): YearMonth {
  return value.slice(0, 7) as YearMonth;
}

/** Reads all the content for the admin forms, drafts included. */
export async function getEditableContent(
  db: Database,
): Promise<EditableContent> {
  return db.transaction(async (tx) => {
    const [profileRow] = await tx.select().from(profile);
    const [contactRow] = await tx.select().from(contact);
    if (profileRow === undefined || contactRow === undefined) {
      throw new Error(
        "Content is missing. Run `pnpm db:setup` to seed the database.",
      );
    }
    const valueRows = await tx
      .select()
      .from(profileValues)
      .orderBy(asc(profileValues.position), asc(profileValues.id));
    const experienceRows = await tx
      .select()
      .from(experience)
      .orderBy(asc(experience.position), asc(experience.id));
    const categoryRows = await tx
      .select()
      .from(skillCategories)
      .orderBy(asc(skillCategories.position), asc(skillCategories.id));
    const skillRows = await tx
      .select()
      .from(skills)
      .orderBy(asc(skills.position), asc(skills.id));
    const projectRows = await tx
      .select()
      .from(projects)
      .orderBy(asc(projects.position), asc(projects.id));

    const skillsByCategory = Map.groupBy(skillRows, (row) => row.categoryId);

    return {
      profile: {
        name: profileRow.name,
        title: bilingual(profileRow.titleEn, profileRow.titleEs),
        slogan: bilingual(profileRow.sloganEn, profileRow.sloganEs),
        headline: bilingual(profileRow.headlineEn, profileRow.headlineEs),
        summary: bilingual(profileRow.summaryEn, profileRow.summaryEs),
        mission: bilingual(profileRow.missionEn, profileRow.missionEs),
        vision: bilingual(profileRow.visionEn, profileRow.visionEs),
      },
      values: valueRows.map((row) => ({
        id: row.id,
        position: row.position,
        title: bilingual(row.titleEn, row.titleEs),
        description: bilingual(row.descriptionEn, row.descriptionEs),
      })),
      experience: experienceRows.map((row) => ({
        id: row.id,
        position: row.position,
        company: row.company,
        role: bilingual(row.roleEn, row.roleEs),
        startMonth: toYearMonth(row.startMonth),
        endMonth: row.endMonth === null ? null : toYearMonth(row.endMonth),
        location: bilingual(row.locationEn, row.locationEs),
        achievements: row.achievements,
        technologies: row.technologies,
      })),
      skillCategories: categoryRows.map((row) => ({
        id: row.id,
        position: row.position,
        name: bilingual(row.nameEn, row.nameEs),
        skills: (skillsByCategory.get(row.id) ?? []).map((skill) => ({
          id: skill.id,
          position: skill.position,
          name: skill.name,
        })),
      })),
      projects: projectRows.map((row) => ({
        id: row.id,
        position: row.position,
        status: row.status,
        title: bilingual(row.titleEn, row.titleEs),
        description: bilingual(row.descriptionEn, row.descriptionEs),
        technologies: row.technologies,
        demoUrl: row.demoUrl,
        codeUrl: row.codeUrl,
        imageUrl: row.imageUrl,
        imageAlt: bilingual(row.imageAltEn, row.imageAltEs),
      })),
      contact: {
        email: contactRow.email,
        whatsapp: contactRow.whatsapp,
        linkedinUrl: contactRow.linkedinUrl,
        githubUrl: contactRow.githubUrl,
      },
    };
  }, READ_SNAPSHOT);
}
