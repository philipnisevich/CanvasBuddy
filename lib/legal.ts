import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Date the legal documents were last reviewed/changed. Bump this (and note the
 * change in the relevant markdown) whenever privacy/terms/subprocessors change.
 */
export const LEGAL_LAST_UPDATED = "July 1, 2026";

export type LegalDoc = "privacy" | "terms" | "subprocessors";

/** Read a legal document's markdown body from content/legal at request time. */
export function readLegalDoc(doc: LegalDoc): string {
  return readFileSync(join(process.cwd(), "content", "legal", `${doc}.md`), "utf8");
}
