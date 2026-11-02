/**
 * Paradox air dates are calendar dates stored at UTC midnight. Formatting
 * them in the viewer's zone would show the previous day across the
 * Americas, so always format in UTC.
 */
export function formatAirDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value.length === 10 ? `${value}T00:00:00Z` : value) : value;
  return d
    .toLocaleDateString("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}
