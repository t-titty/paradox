import { describe, expect, it } from "vitest";
import { computeStreak, daysToFreeze } from "../src/lib/streaks.js";

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    const r = computeStreak(["2026-10-29", "2026-10-30", "2026-10-31"], "2026-10-31");
    expect(r).toEqual({ current: 3, best: 3, votedToday: true });
  });

  it("keeps yesterday's streak alive before today's vow", () => {
    const r = computeStreak(["2026-10-29", "2026-10-30"], "2026-10-31");
    expect(r.current).toBe(2);
    expect(r.votedToday).toBe(false);
  });

  it("breaks after a missed day", () => {
    expect(computeStreak(["2026-10-28", "2026-10-29"], "2026-10-31").current).toBe(0);
  });

  it("tracks the best run separately", () => {
    const r = computeStreak(
      ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-30", "2026-10-31"],
      "2026-10-31",
    );
    expect(r.current).toBe(2);
    expect(r.best).toBe(4);
  });

  it("handles no history", () => {
    expect(computeStreak([], "2026-10-31")).toEqual({ current: 0, best: 0, votedToday: false });
  });
});

describe("daysToFreeze", () => {
  it("bridges a single missed day", () => {
    expect(daysToFreeze(["2026-10-29"], "2026-10-31", 1)).toEqual(["2026-10-30"]);
  });

  it("does nothing when the gap is wider than the freezes held", () => {
    expect(daysToFreeze(["2026-10-27"], "2026-10-31", 2)).toEqual([]);
  });

  it("does nothing when there is no gap", () => {
    expect(daysToFreeze(["2026-10-30"], "2026-10-31", 3)).toEqual([]);
  });

  it("does nothing without a previous streak", () => {
    expect(daysToFreeze([], "2026-10-31", 3)).toEqual([]);
  });
});
