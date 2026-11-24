import { expect } from "vitest";
import { ContentValidationError } from "../../src/content";

/** Awaits a write expected to be rejected and returns its issues. */
export async function rejectionIssues(write: Promise<unknown>) {
  const error = await write.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ContentValidationError);
  return (error as ContentValidationError).issues;
}

/** The `field` and `code` of each issue, ignoring the message. */
export async function rejectedFields(write: Promise<unknown>) {
  const issues = await rejectionIssues(write);
  return issues.map(({ field, code }) => ({ field, code }));
}

/**
 * Waits a few milliseconds, so two writes in a row get different
 * `now()` values at the millisecond precision of `Date`.
 */
export function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 5));
}
