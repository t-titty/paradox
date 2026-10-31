import { describe, expect, it } from "vitest";
import {
  addDaysYmd,
  diffDaysYmd,
  weekStartYmd,
  weekdayYmd,
  zonedParts,
  zonedTimeToUtc,
  zonedYmd,
} from "../src/lib/time.js";

describe("time zones", () => {
  it("reads wall-clock parts in a zone", () => {
    // 2026-07-01 12:00 UTC is 08:00 in New York (EDT, UTC-4).
    const p = zonedParts(new Date("2026-07-01T12:00:00Z"), "America/New_York");
    expect(p.hour).toBe(8);
    expect(p.day).toBe(1);
  });

  it("converts zoned wall time to UTC across DST", () => {
    expect(zonedTimeToUtc(2026, 7, 1, 8, "America/New_York").toISOString()).toBe("2026-07-01T12:00:00.000Z");
    expect(zonedTimeToUtc(2026, 1, 15, 8, "America/New_York").toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("gives the zone's date, not the UTC date", () => {
    // 02:00 UTC on Nov 1 is still Oct 31 in New York.
    expect(zonedYmd(new Date("2026-11-01T02:00:00Z"), "America/New_York")).toBe("2026-10-31");
    expect(zonedYmd(new Date("2026-11-01T02:00:00Z"), "UTC")).toBe("2026-11-01");
  });

  it("does calendar arithmetic on YYYY-MM-DD", () => {
    expect(addDaysYmd("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysYmd("2026-03-01", -1)).toBe("2026-02-28");
    expect(diffDaysYmd("2026-10-01", "2026-10-31")).toBe(30);
    expect(weekdayYmd("2026-10-29")).toBe(4); // Thursday
    expect(weekStartYmd("2026-11-01")).toBe("2026-10-26"); // Sunday → Monday before
    expect(weekStartYmd("2026-10-26")).toBe("2026-10-26");
  });
});
