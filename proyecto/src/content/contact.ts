import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "./db";
import { contact } from "./schema";
import { touchContentState } from "./state";
import { email, optionalHttpsUrl, parseInput, whatsapp } from "./validation";

const CONTACT_ID = 1;

/** Input of `updateContact`; the links may be empty (FR-016). */
export const contactInputSchema = z.strictObject({
  email: email(),
  whatsapp: whatsapp(),
  linkedinUrl: optionalHttpsUrl(),
  githubUrl: optionalHttpsUrl(),
});

export type ContactInput = z.input<typeof contactInputSchema>;

/** Replaces the contact details. The seed never overwrites them. */
export async function updateContact(
  db: Database,
  input: ContactInput,
): Promise<void> {
  const data = parseInput(contactInputSchema, input);
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(contact)
      .set(data)
      .where(eq(contact.id, CONTACT_ID))
      .returning({ id: contact.id });
    if (updated.length === 0) {
      throw new Error(
        "Contact is missing. Run `pnpm db:setup` to seed the database.",
      );
    }
    await touchContentState(tx);
  });
}
