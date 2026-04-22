/**
 * Input sanitization for free-form text fields. Removes anything that looks
 * like an HTML tag or HTML entity so a malicious user can't smuggle markup
 * into log output, AI prompts, or downstream renderers that bypass React's
 * escape.
 *
 * This is defense-in-depth — React escapes on render, but data also flows
 * to logs, emails, admin tooling, and the Oracle prompt; we prefer the raw
 * DB value itself to be free of HTML markup.
 *
 * Not a replacement for contextual escaping. Do not use this to sanitize
 * HTML intended to be rendered as HTML — for that we'd need sanitize-html
 * with an allowlist, which we don't do anywhere today.
 */

// Matches opening, closing, and self-closing tags.
const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
// Matches numeric and named HTML entities (&#60; &amp; etc).
const ENTITY_RE = /&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,8});/g;

export function stripHtml(input: string): string {
  return input.replace(TAG_RE, "").replace(ENTITY_RE, "").trim();
}

/**
 * Zod-friendly transformer. Use like:
 *   z.string().min(2).max(200).transform(cleanText)
 */
export function cleanText(input: string): string {
  return stripHtml(input);
}
