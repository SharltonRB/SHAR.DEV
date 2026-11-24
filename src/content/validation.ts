import { z } from "zod";
import {
  type ContentIssue,
  ContentValidationError,
  type IssueCode,
} from "./errors";

/** Maximum lengths from FR-021, counted in code points. */
export const TEXT_LIMITS = {
  /** Titles, and every short text: name, role, company, location, skill, technology. */
  title: 80,
  slogan: 80,
  headline: 120,
  projectDescription: 300,
  achievement: 200,
  valueDescription: 200,
  /** Professional summary, mission and vision. */
  longText: 1200,
  imageAlt: 150,
} as const;

type Problem = { code: IssueCode; message: string } | undefined;
type Check = (value: string) => Problem;

const PHONE = /^\+\d{8,15}$/;
// Years before 1000 are rejected so the value always fits a Postgres `date`.
const YEAR_MONTH = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;
const CONTENT_TIME_ZONE = "America/Costa_Rica";

/** Length in code points, so an emoji counts as one character. */
function length(value: string): number {
  return [...value].length;
}

function maxLength(max: number): Check {
  return (value) =>
    length(value) > max
      ? { code: "too_long", message: `Must be at most ${max} characters.` }
      : undefined;
}

// `new URL()` also accepts forms like `https:example.com` or inner spaces,
// which would be published as broken links.
const HTTPS_PREFIX = /^https:\/\/\S+$/i;

const httpsUrlCheck: Check = (value) => {
  try {
    if (HTTPS_PREFIX.test(value) && new URL(value).protocol === "https:") {
      return undefined;
    }
  } catch {
    // Falls through to the issue below.
  }
  return { code: "invalid_url", message: "Must be a valid https URL." };
};

const emailCheck: Check = (value) =>
  z.regexes.email.test(value)
    ? undefined
    : { code: "invalid_email", message: "Must be a valid email address." };

const phoneCheck: Check = (value) =>
  PHONE.test(value)
    ? undefined
    : {
        code: "invalid_phone",
        message: "Must be + followed by 8 to 15 digits.",
      };

/** The current month as `YYYY-MM` in the site owner's time zone. */
export function currentYearMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONTENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const part = (type: "year" | "month") =>
    parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}`;
}

const yearMonthCheck: Check = (value) => {
  if (!YEAR_MONTH.test(value)) {
    return { code: "invalid_date", message: "Must be a month as YYYY-MM." };
  }
  // `YYYY-MM` strings sort in calendar order.
  if (value > currentYearMonth()) {
    return { code: "future_date", message: "Must not be a future month." };
  }
  return undefined;
};

function addProblem(ctx: z.RefinementCtx, problem: Problem): void {
  if (problem) {
    ctx.addIssue({
      code: "custom",
      message: problem.message,
      params: { code: problem.code },
    });
  }
}

/**
 * A string without NUL characters, which Postgres `text` cannot store, and
 * without surrounding whitespace.
 */
function normalizedString() {
  return z
    .string()
    .overwrite((value) => value.replaceAll("\u0000", ""))
    .trim();
}

/** Trimmed string that must not be empty and must pass `check`. */
function required(check: Check) {
  return normalizedString().superRefine((value, ctx) => {
    addProblem(
      ctx,
      value === "" ? { code: "required", message: "Required." } : check(value),
    );
  });
}

/**
 * Trimmed string that may be missing, null or blank, all stored as `null`.
 * A non-blank value must pass `check`.
 */
function optional(check: Check) {
  return normalizedString()
    .superRefine((value, ctx) => {
      if (value !== "") addProblem(ctx, check(value));
    })
    .nullish()
    .transform((value) => value || null);
}

export const requiredText = (max: number) => required(maxLength(max));
export const optionalText = (max: number) => optional(maxLength(max));

/**
 * Options for an object-level rule that reads only `fields`. Zod skips such
 * a rule whenever any other field is missing; this runs it as long as its
 * own fields are valid, so every problem is reported at once (FR-019).
 */
export function whenFieldsValid(...fields: string[]) {
  return {
    when: (payload: z.core.ParsePayload) =>
      payload.issues.every((issue) => {
        const [first] = issue.path ?? [];
        return first === undefined
          ? issue.code === "unrecognized_keys"
          : !fields.includes(String(first));
      }),
  };
}

/** English required, Spanish optional (FR-001, FR-002). */
export function bilingualText(max: number) {
  return z.strictObject({ en: requiredText(max), es: optionalText(max) });
}

/**
 * Optional in both languages; a missing object reads as both `null`.
 * Spanish without English is rejected, since English is the main language
 * and the fallback (FR-001, FR-007).
 */
export function optionalBilingualText(max: number) {
  return z
    .strictObject({ en: optionalText(max), es: optionalText(max) })
    .superRefine((value, ctx) => {
      if (value.en === null && value.es !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["en"],
          message: "Required when the Spanish text is set.",
          params: { code: "required" },
        });
      }
    })
    .nullish()
    .transform((value) => value ?? { en: null, es: null });
}

export const optionalHttpsUrl = () => optional(httpsUrlCheck);
export const email = () => required(emailCheck);
export const whatsapp = () => required(phoneCheck);

/** A month as `YYYY-MM`, not later than the current month (FR-010). */
export const yearMonth = () => required(yearMonthCheck);
export const optionalYearMonth = () => optional(yearMonthCheck);

/** At least one technology; each one non-empty and a short text. */
export function technologies() {
  return z
    .array(requiredText(TEXT_LIMITS.title))
    .min(1, "At least one technology is required.");
}

function toPath(path: readonly PropertyKey[]): string {
  return path.map(String).join(".");
}

/**
 * Maps a Zod issue to the module's codes. A schema that produces any other
 * issue is a bug in this module, so it throws instead of guessing a code.
 */
function toIssues(issue: z.core.$ZodIssue): ContentIssue[] {
  const field = toPath(issue.path);
  switch (issue.code) {
    case "custom":
      if (issue.params?.code) {
        return [{ field, code: issue.params.code, message: issue.message }];
      }
      break;
    case "unrecognized_keys":
      return issue.keys.map((key) => ({
        field: toPath([...issue.path, key]),
        code: "unknown_field",
        message: "Unknown field.",
      }));
    case "invalid_type":
    case "invalid_value":
      // A missing value, one of the wrong type or outside an enum: the
      // field has no usable value.
      return [{ field, code: "required", message: issue.message }];
    case "too_small":
      if (issue.origin === "array") {
        return [{ field, code: "too_few", message: issue.message }];
      }
      break;
    case "too_big":
      if (issue.origin === "array") {
        return [{ field, code: "too_many", message: issue.message }];
      }
      break;
  }
  throw new Error(
    `Unmapped validation issue "${issue.code}" at "${field}". Give the schema an IssueCode.`,
  );
}

/**
 * Validates `input` against `schema` and returns the normalized value.
 * Throws `ContentValidationError` listing every problem at once (FR-019).
 */
export function parseInput<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ContentValidationError(result.error.issues.flatMap(toIssues));
  }
  return result.data;
}
