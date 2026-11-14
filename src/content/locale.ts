import { ContentValidationError } from "./errors";

export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Rejects anything other than a supported locale (FR-003). */
export function assertLocale(value: unknown): asserts value is Locale {
  if (!SUPPORTED_LOCALES.includes(value as Locale)) {
    throw new ContentValidationError([
      {
        field: "locale",
        code: "unsupported_locale",
        message: `Locale must be one of: ${SUPPORTED_LOCALES.join(", ")}.`,
      },
    ]);
  }
}

/**
 * Picks the text for a locale. Spanish is used only when it has text after
 * trimming; otherwise the English text is the fallback (FR-002). Writes
 * already store blank Spanish as null; the check here is a safety net.
 */
export function resolveText<T extends string | null>(
  en: T,
  es: string | null | undefined,
  locale: Locale,
): string | T {
  if (locale === "es" && es != null && es.trim() !== "") {
    return es;
  }
  return en;
}
