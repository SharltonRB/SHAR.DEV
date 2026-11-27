import { getDb, getPublishedContent, type Locale } from "../content";

/**
 * Build-time read of the published content. Astro exposes `.env.local` on
 * `import.meta.env`, while `getDb()` reads `process.env` (set by Vercel).
 */
export function loadContent(locale: Locale) {
  process.env.DATABASE_URL ??= import.meta.env.DATABASE_URL;
  return getPublishedContent(getDb(), locale);
}
