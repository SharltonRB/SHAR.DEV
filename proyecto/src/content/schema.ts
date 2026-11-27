import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** A bilingual list item: English is required, Spanish is optional. */
export type BilingualItem = { en: string; es: string | null };

/** Primary key for single-row tables: the only valid id is 1. */
const singletonId = () => integer("id").primaryKey();

const identityId = () => integer("id").primaryKey().generatedAlwaysAsIdentity();

const position = () => integer("position").notNull();

export const profile = pgTable(
  "profile",
  {
    id: singletonId(),
    name: text("name").notNull(),
    titleEn: text("title_en").notNull(),
    titleEs: text("title_es"),
    sloganEn: text("slogan_en").notNull(),
    sloganEs: text("slogan_es"),
    headlineEn: text("headline_en"),
    headlineEs: text("headline_es"),
    summaryEn: text("summary_en").notNull(),
    summaryEs: text("summary_es"),
    missionEn: text("mission_en").notNull(),
    missionEs: text("mission_es"),
    visionEn: text("vision_en").notNull(),
    visionEs: text("vision_es"),
  },
  (t) => [check("profile_singleton", sql`${t.id} = 1`)],
);

export const profileValues = pgTable("profile_values", {
  id: identityId(),
  titleEn: text("title_en").notNull(),
  titleEs: text("title_es"),
  descriptionEn: text("description_en").notNull(),
  descriptionEs: text("description_es"),
  position: position(),
});

export const experience = pgTable(
  "experience",
  {
    id: identityId(),
    company: text("company").notNull(),
    roleEn: text("role_en").notNull(),
    roleEs: text("role_es"),
    startMonth: date("start_month").notNull(),
    endMonth: date("end_month"),
    locationEn: text("location_en").notNull(),
    locationEs: text("location_es"),
    achievements: jsonb("achievements").$type<BilingualItem[]>().notNull(),
    technologies: text("technologies").array().notNull(),
    position: position(),
  },
  (t) => [
    check(
      "experience_end_after_start",
      sql`${t.endMonth} IS NULL OR ${t.endMonth} >= ${t.startMonth}`,
    ),
  ],
);

export const skillCategories = pgTable("skill_categories", {
  id: identityId(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es"),
  position: position(),
});

export const skills = pgTable(
  "skills",
  {
    id: identityId(),
    categoryId: integer("category_id").notNull(),
    name: text("name").notNull(),
    position: position(),
  },
  (t) => [
    foreignKey({
      name: "skills_category_id_fk",
      columns: [t.categoryId],
      foreignColumns: [skillCategories.id],
    }).onDelete("restrict"),
    uniqueIndex("skills_category_name_unique").on(
      t.categoryId,
      sql`lower(${t.name})`,
    ),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: identityId(),
    titleEn: text("title_en").notNull(),
    titleEs: text("title_es"),
    descriptionEn: text("description_en").notNull(),
    descriptionEs: text("description_es"),
    technologies: text("technologies").array().notNull(),
    demoUrl: text("demo_url"),
    codeUrl: text("code_url"),
    imageUrl: text("image_url"),
    imageAltEn: text("image_alt_en"),
    imageAltEs: text("image_alt_es"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    position: position(),
  },
  (t) => [
    check("projects_status_valid", sql`${t.status} IN ('draft', 'published')`),
    check(
      "projects_image_has_alt",
      sql`${t.imageUrl} IS NULL OR ${t.imageAltEn} IS NOT NULL`,
    ),
  ],
);

export const contact = pgTable(
  "contact",
  {
    id: singletonId(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp").notNull(),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
  },
  (t) => [
    check("contact_singleton", sql`${t.id} = 1`),
    check("contact_whatsapp_format", sql`${t.whatsapp} ~ '^\\+\\d{8,15}$'`),
  ],
);

export const contentState = pgTable(
  "content_state",
  {
    id: singletonId(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("content_state_singleton", sql`${t.id} = 1`)],
);
