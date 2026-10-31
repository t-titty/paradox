import { describe, expect, it } from "vitest";
import { validateJustification } from "../src/lib/sentence.js";
import { isValidMessageForMode, PRACTICE_TIMING, resolveMode } from "../src/lib/duelPhases.js";
import { oppositionScore } from "../src/lib/pairing.js";
import { sparringTribeFor } from "../src/lib/bots.js";
import { canPair } from "../src/lib/circleSafety.js";
import { classifyShift } from "../src/lib/throwback.js";
import { badgesFor, titleFor } from "../src/lib/progression.js";
import { computeConstellation, computeDrift } from "../src/lib/constellation.js";
import { sparScale } from "../src/lib/gamification.js";

describe("one-sentence justification", () => {
  it("accepts one sentence", () => {
    expect(validateJustification("The many outweigh the one.").valid).toBe(true);
  });
  it("rejects two sentences", () => {
    expect(validateJustification("The many matter. The one does too.").valid).toBe(false);
  });
  it("ignores abbreviations and decimals", () => {
    expect(validateJustification("Dr. Smith would save 2.5 times as many lives!").valid).toBe(true);
  });
});

describe("duel modes", () => {
  const start = new Date("2026-10-31T20:00:00Z");
  const plus = (ms: number) => new Date(start.getTime() + ms);

  it("walks clarification → crucible → bridge → over", () => {
    expect(resolveMode(start, plus(60_000)).mode).toBe("clarification");
    expect(resolveMode(start, plus(4 * 60_000)).mode).toBe("crucible");
    expect(resolveMode(start, plus(9 * 60_000)).mode).toBe("bridge");
    expect(resolveMode(start, plus(10 * 60_000)).mode).toBe("over");
  });

  it("supports the compressed practice clock", () => {
    expect(resolveMode(start, plus(90_000), PRACTICE_TIMING).mode).toBe("crucible");
    expect(resolveMode(start, plus(4 * 60_000), PRACTICE_TIMING).mode).toBe("over");
  });

  it("only allows questions in clarification", () => {
    expect(isValidMessageForMode("clarification", "Why?").ok).toBe(true);
    expect(isValidMessageForMode("clarification", "Because.").ok).toBe(false);
    expect(isValidMessageForMode("crucible", "Because.").ok).toBe(true);
  });
});

describe("matchmaking rules", () => {
  it("pairs the AI partner from the most opposed tribe", () => {
    expect(sparringTribeFor("Utilitarian")).toBe("Deontologist");
    expect(sparringTribeFor("Stoic")).toBe("Hedonist");
    expect(sparringTribeFor("VirtueEthicist")).toBe("Nihilist");
    expect(oppositionScore("Stoic", "Stoic")).toBe(0);
  });

  it("keeps school-circle players inside their circle", () => {
    expect(canPair([], [])).toBe(true);
    expect(canPair(["c1"], [])).toBe(false);
    expect(canPair([], ["c1"])).toBe(false);
    expect(canPair(["c1", "c2"], ["c2"])).toBe(true);
    expect(canPair(["c1"], ["c3"])).toBe(false);
  });

  it("halves spar rewards with a floor of 1", () => {
    expect(sparScale(10, true)).toBe(5);
    expect(sparScale(3, true)).toBe(1);
    expect(sparScale(3, false)).toBe(3);
  });
});

describe("throwback shift", () => {
  it("detects a flipped vote", () => {
    expect(classifyShift("A", "x y z", "B", "x y z")).toBe("shifted");
  });
  it("detects held vs evolved reasoning", () => {
    expect(classifyShift("A", "the many outweigh the one", "A", "the many outweigh the one")).toBe("held");
    expect(classifyShift("A", "the many outweigh the one", "A", "duty forbids using a person as a tool")).toBe(
      "evolved",
    );
  });
});

describe("progression", () => {
  it("maps WP to titles", () => {
    expect(titleFor(0).current.label).toBe("INITIATE");
    expect(titleFor(60).current.label).toBe("SOPHIST");
    expect(titleFor(60).next?.label).toBe("DIALECTICIAN");
    expect(titleFor(99999).next).toBeNull();
  });

  it("awards badges from stats", () => {
    const earned = badgesFor({
      votes: 1,
      bestStreak: 7,
      pvpDuels: 0,
      spars: 1,
      syntheses: 0,
      goldStars: 0,
      shiftedThrowbacks: 0,
      distinctTribes: 2,
      airedSubmissions: 0,
    })
      .filter((b) => b.earned)
      .map((b) => b.key);
    expect(earned).toEqual(["first_vow", "week_streak", "sparring"]);
  });
});

describe("constellation", () => {
  it("averages tribe positions and reports drift", () => {
    expect(computeConstellation([]).position).toEqual([0, 0, 0]);
    const d = computeDrift(["Utilitarian", "Utilitarian"], ["Deontologist"]);
    expect(d.dominantTribe).toBe("Utilitarian");
    expect(d.delta![0]).toBeCloseTo(1.8);
    expect(computeDrift([], []).delta).toBeNull();
  });
});
