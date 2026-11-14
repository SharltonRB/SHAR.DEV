/** Machine-readable reason for a rejected field. The admin UI translates it. */
export type IssueCode =
  | "required"
  | "too_long"
  | "unknown_field"
  | "invalid_url"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_date"
  | "invalid_date_range"
  | "future_date"
  | "too_few"
  | "too_many"
  | "duplicate"
  | "not_empty"
  | "invalid_order"
  | "unsupported_locale";

/**
 * One rejected field. `field` is a dotted path such as `title.en` or
 * `achievements.2.en`; `message` is English and meant for logs.
 */
export type ContentIssue = { field: string; code: IssueCode; message: string };

/** A write or read was rejected; nothing was saved. Lists every problem. */
export class ContentValidationError extends Error {
  readonly issues: ContentIssue[];

  constructor(issues: ContentIssue[]) {
    const summary = issues
      .map((issue) => `${issue.field || "(input)"}: ${issue.message}`)
      .join("; ");
    super(`Invalid content. ${summary}`);
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

export type ContentEntity =
  | "value"
  | "experience"
  | "skillCategory"
  | "skill"
  | "project";

/** The element to update or delete does not exist; nothing was changed. */
export class ContentNotFoundError extends Error {
  readonly entity: ContentEntity;
  readonly id: number;

  constructor(entity: ContentEntity, id: number) {
    super(`${entity} ${id} not found.`);
    this.name = "ContentNotFoundError";
    this.entity = entity;
    this.id = id;
  }
}
