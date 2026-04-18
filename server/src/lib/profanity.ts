import Filter from "bad-words";

// Single shared filter. Cheap to construct but no reason to rebuild it per
// request — the dictionary is static.
const filter = new Filter();

/**
 * Returns true if the text contains a slur or profanity per bad-words'
 * default dictionary. We don't replace or sanitize — the spec is to reject
 * outright with a 400, so callers just need a boolean.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  try {
    return filter.isProfane(text);
  } catch {
    // isProfane is synchronous and safe, but guard against unexpected
    // throws so a bad input never 500s the request.
    return false;
  }
}
