import { describe, expect, it } from "vitest";
import { duelsOpen, lateVowsOpen, parseYmd, resolvePhase, ymd } from "../src/phases.js";

// Game clock is America/New_York (see vitest.config.ts); default hours 8/12/20.
const at = (iso: string) => resolvePhase(new Date(iso));

describe("resolvePhase on the game clock", () => {
  it("is bridge before the drop", () => {
    const s = at("2026-07-01T10:00:00Z"); // 06:00 EDT
    expect(s.phase).toBe("bridge");
    expect(s.today).toBe("2026-07-01");
    expect(s.nextTransitionAt).toBe("2026-07-01T12:00:00.000Z");
  });

  it("is vow from 08:00 to noon", () => {
    const s = at("2026-07-01T13:30:00Z"); // 09:30 EDT
    expect(s.phase).toBe("vow");
    expect(s.nextTransitionAt).toBe("2026-07-01T16:00:00.000Z");
    expect(lateVowsOpen(s)).toBe(false);
    expect(duelsOpen(s)).toBe(false);
  });

  it("is sort from noon with duels and late vows open", () => {
    const s = at("2026-07-01T18:00:00Z"); // 14:00 EDT
    expect(s.phase).toBe("sort");
    expect(duelsOpen(s)).toBe(true);
    expect(lateVowsOpen(s)).toBe(true);
  });

  it("is duel from 20:00 until midnight game time", () => {
    const s = at("2026-07-02T02:30:00Z"); // 22:30 EDT on Jul 1
    expect(s.phase).toBe("duel");
    expect(s.today).toBe("2026-07-01");
    expect(s.nextTransitionAt).toBe("2026-07-02T04:00:00.000Z");
    expect(s.nextDropAt).toBe("2026-07-02T12:00:00.000Z");
  });

  it("is independent of the host time zone", () => {
    // A UTC host at 01:00 on Jul 2 is still the evening of Jul 1 in New York.
    expect(at("2026-07-02T01:00:00Z").today).toBe("2026-07-01");
  });

  it("round-trips @db.Date values in UTC", () => {
    expect(ymd(parseYmd("2026-10-31"))).toBe("2026-10-31");
    expect(parseYmd("2026-10-31").toISOString()).toBe("2026-10-31T00:00:00.000Z");
  });
});
