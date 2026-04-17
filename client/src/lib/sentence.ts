/**
 * Mirror of the server's justification validator — same rules, same messages.
 * Kept in sync manually; server remains source of truth for security.
 */
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

export interface JustificationCheck {
  valid: boolean;
  reason?: string;
}

export function validateJustification(raw: string): JustificationCheck {
  const text = raw.trim();
  if (text.length === 0) return { valid: false, reason: "Write your justification." };
  if (text.length < 10) return { valid: false, reason: "Too short — say something real." };
  if (text.length > 500) return { valid: false, reason: "Too long — one sentence, max 500 chars." };

  let scrubbed = text.toLowerCase();
  for (const abbr of ABBREVIATIONS) {
    scrubbed = scrubbed.split(abbr).join("X".repeat(abbr.length));
  }
  scrubbed = scrubbed.replace(/\d\.\d/g, "XXX");

  const groups = scrubbed.match(/[.!?]+/g) ?? [];
  if (groups.length === 0) return { valid: false, reason: "End with . ! or ?" };
  if (groups.length > 1) {
    return { valid: false, reason: "One sentence only. Drop the extra punctuation." };
  }
  if (!/[.!?]+\s*$/.test(scrubbed)) {
    return { valid: false, reason: "Sentence must end with punctuation." };
  }
  return { valid: true };
}
