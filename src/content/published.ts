import { asc } from "drizzle-orm";
import type { Database } from "./db";
import { assertLocale, type Locale, resolveText } from "./locale";
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

/** The content of the public site in one locale, texts already resolved. */
export type PublishedContent = {
  locale: Locale;
  profile: {
    name: string;
    title: string;
    slogan: string;
    /** Null when it has no text in either language. */
    headline: string | null;
    summary: string;
    mission: string;
    vision: string;
  };
  values: { id: number; title: string; description: string }[];
  experience: {
    id: number;
    company: string;
    role: string;
    location: string;
    startMonth: YearMonth;
    /** Null for the current position. */
    endMonth: YearMonth | null;
    /** Only for the current position. */
    endLabel: "Present" | "Presente" | null;
    achievements: string[];
    technologies: string[];
  }[];
  skillCategories: {
    id: number;
    name: string;
    skills: { id: number; name: string }[];
  }[];
  projects: {
    id: number;
    title: string;
    description: string;
    technologies: string[];
    demoUrl: string | null;
    codeUrl: string | null;
    image: { url: string; alt: string } | null;
  }[];
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

/** Reads every table in one snapshot, each list in the administrator's order. */
async function readContentRows(db: Database) {
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

    return {
      profileRow,
      contactRow,
      valueRows,
      experienceRows,
      categoryRows,
      // Grouping keeps the global order, so each category's skills stay sorted.
      skillsByCategory: Map.groupBy(skillRows, (row) => row.categoryId),
      projectRows,
    };
  }, READ_SNAPSHOT);
}

function toContact(row: typeof contact.$inferSelect): EditableContact {
  return {
    email: row.email,
    whatsapp: row.whatsapp,
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
  };
}

/** Reads all the content for the admin forms, drafts included. */
export async function getEditableContent(
  db: Database,
): Promise<EditableContent> {
  const rows = await readContentRows(db);
  const { profileRow } = rows;

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
    values: rows.valueRows.map((row) => ({
      id: row.id,
      position: row.position,
      title: bilingual(row.titleEn, row.titleEs),
      description: bilingual(row.descriptionEn, row.descriptionEs),
    })),
    experience: rows.experienceRows.map((row) => ({
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
    skillCategories: rows.categoryRows.map((row) => ({
      id: row.id,
      position: row.position,
      name: bilingual(row.nameEn, row.nameEs),
      skills: (rows.skillsByCategory.get(row.id) ?? []).map((skill) => ({
        id: skill.id,
        position: skill.position,
        name: skill.name,
      })),
    })),
    projects: rows.projectRows.map((row) => ({
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
    contact: toContact(rows.contactRow),
  };
}

const PRESENT_LABEL = { en: "Present", es: "Presente" } as const;

/**
 * Everything the public site shows in one locale, read at build time: each
 * text resolved with English as the fallback (FR-001, FR-002), every list
 * in the administrator's order and only published projects (FR-004 to
 * FR-006). Rejects any locale other than `en` and `es` (FR-003).
 */
export async function getPublishedContent(
  db: Database,
  locale: string,
): Promise<PublishedContent> {
  assertLocale(locale);
  const rows = await readContentRows(db);
  const { profileRow } = rows;
  const text = <T extends string | null>(en: T, es: string | null) =>
    resolveText(en, es, locale);

  return {
    locale,
    profile: {
      name: profileRow.name,
      title: text(profileRow.titleEn, profileRow.titleEs),
      slogan: text(profileRow.sloganEn, profileRow.sloganEs),
      headline: text(profileRow.headlineEn, profileRow.headlineEs),
      summary: text(profileRow.summaryEn, profileRow.summaryEs),
      mission: text(profileRow.missionEn, profileRow.missionEs),
      vision: text(profileRow.visionEn, profileRow.visionEs),
    },
    values: rows.valueRows.map((row) => ({
      id: row.id,
      title: text(row.titleEn, row.titleEs),
      description: text(row.descriptionEn, row.descriptionEs),
    })),
    experience: rows.experienceRows.map((row) => ({
      id: row.id,
      company: row.company,
      role: text(row.roleEn, row.roleEs),
      location: text(row.locationEn, row.locationEs),
      startMonth: toYearMonth(row.startMonth),
      endMonth: row.endMonth === null ? null : toYearMonth(row.endMonth),
      endLabel: row.endMonth === null ? PRESENT_LABEL[locale] : null,
      achievements: row.achievements.map((item) => text(item.en, item.es)),
      technologies: row.technologies,
    })),
    skillCategories: rows.categoryRows.map((row) => ({
      id: row.id,
      name: text(row.nameEn, row.nameEs),
      skills: (rows.skillsByCategory.get(row.id) ?? []).map((skill) => ({
        id: skill.id,
        name: skill.name,
      })),
    })),
    projects: rows.projectRows
      .filter((row) => row.status === "published")
      .map((row) => ({
        id: row.id,
        title: text(row.titleEn, row.titleEs),
        description: text(row.descriptionEn, row.descriptionEs),
        technologies: row.technologies,
        demoUrl: row.demoUrl,
        codeUrl: row.codeUrl,
        // The schema requires English alt text whenever there is an image.
        image:
          row.imageUrl === null
            ? null
            : {
                url: row.imageUrl,
                alt: text(row.imageAltEn ?? "", row.imageAltEs),
              },
      })),
    contact: toContact(rows.contactRow),
  };
}
