import { describe, expect, it } from "vitest";
import { costMicros } from "../src/lib/aiPricing.js";
import { splitPerDollar } from "../src/lib/openBooks.js";
import { estimateStripeFeeCents } from "../src/lib/pricing.js";

describe("AI cost math", () => {
  it("prices tokens per million, including cache reads and writes", () => {
    // Haiku 5.5: $0.10 in / $0.50 out per MTok.
    expect(costMicros("claude-haiku-5-5", { inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 })).toBe(100_000);
    expect(costMicros("claude-haiku-5-5", { inputTokens: 0, outputTokens: 1000, cacheReadTokens: 0, cacheWriteTokens: 0 })).toBe(500);
    // Cache read 0.1×, cache write 1.25× of input ($3/MTok on Sonnet 4.6).
    expect(costMicros("claude-sonnet-4-6", { inputTokens: 0, outputTokens: 0, cacheReadTokens: 1000, cacheWriteTokens: 1000 })).toBe(300 + 3750);
  });
  it("costs unknown models at zero rather than guessing", () => {
    expect(costMicros("some-new-model", { inputTokens: 1e6, outputTokens: 1e6, cacheReadTokens: 0, cacheWriteTokens: 0 })).toBe(0);
  });
});

describe("Stripe fee estimate", () => {
  it("is 2.9% + 30¢", () => {
    expect(estimateStripeFeeCents(300)).toBe(39);
    expect(estimateStripeFeeCents(2400)).toBe(100);
  });
});

describe("splitPerDollar", () => {
  it("splits each dollar across costs with the rest as profit", () => {
    const out = splitPerDollar(1000, [
      { label: "Stripe", cents: 130 },
      { label: "AI", cents: 200 },
      { label: "Servers", cents: 500 },
    ])!;
    expect(out).toEqual([
      { label: "Stripe", cents: 13 },
      { label: "AI", cents: 20 },
      { label: "Servers", cents: 50 },
      { label: "Profit (developer pay + reinvestment)", cents: 17 },
    ]);
  });
  it("omits profit when costs exceed income", () => {
    const out = splitPerDollar(100, [{ label: "Servers", cents: 500 }])!;
    expect(out).toEqual([{ label: "Servers", cents: 500 }]);
  });
  it("returns null with no income", () => {
    expect(splitPerDollar(0, [{ label: "Servers", cents: 500 }])).toBeNull();
  });
});
