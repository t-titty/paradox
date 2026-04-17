/**
 * Justification must be EXACTLY one sentence. The client shows live feedback
 * using the same rules; keep these two in sync.
 *
 * Rules:
 *  1. 10–500 chars after trim.
 *  2. Must end with one of . ! ?  (allow trailing whitespace).
 *  3. May contain exactly one *group* of sentence-terminating punctuation,
 *     and that group must be at the end. Consecutive terminators like "!!!"
 *     count as one group.
 *  4. Terminators inside numbers (e.g. "3.14") or common abbreviations
 *     (Mr./Mrs./Dr./St./e.g./i.e.) are excluded before counting.
 *
 * This is intentionally opinionated — the spec says "one sentence only, no
 * period-splicing." False positives (rejecting something that reads like one
 * sentence) are worse than false negatives, so be permissive on abbreviations
 * and strict on clear multi-sentence structure.
 */
export interface JustificationCheck {
  valid: boolean;
  reason?: string;
}

const ABBREVIATIONS = [
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "st.",
  "e.g.",
  "i.e.",
  "etc.",
  "vs.",
  "jr.",
  "sr.",
];

export function validateJustification(raw: string): JustificationCheck {
  const text = raw.trim();

  if (text.length === 0) return { valid: false, reason: "Write your justification." };
  if (text.length < 10) return { valid: false, reason: "Too short — say something real." };
  if (text.length > 500) return { valid: false, reason: "Too long — one sentence, max 500 chars." };

  // Strip abbreviations and decimal-like patterns before counting terminators.
  let scrubbed = text.toLowerCase();
  for (const abbr of ABBREVIATIONS) {
    scrubbed = scrubbed.split(abbr).join("X".repeat(abbr.length));
  }
  // Decimals: digit.digit
  scrubbed = scrubbed.replace(/\d\.\d/g, "XXX");

  // Count terminator groups. A "group" is one-or-more . ! ? in a row.
  const groups = scrubbed.match(/[.!?]+/g) ?? [];
  if (groups.length === 0) {
    return { valid: false, reason: "End with . ! or ?" };
  }
  if (groups.length > 1) {
    return { valid: false, reason: "One sentence only. Drop the extra punctuation." };
  }

  // The single terminator group must be at the end (ignoring trailing space).
  if (!/[.!?]+\s*$/.test(scrubbed)) {
    return { valid: false, reason: "Sentence must end with punctuation." };
  }

  return { valid: true };
}
