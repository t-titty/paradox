import { env } from "../env.js";

/**
 * List prices (USD per million tokens) used to turn token counts into
 * dollars for the public Open Books page. Keep in sync with Anthropic's
 * pricing page; override or add models without a deploy via
 * AI_PRICES_JSON, e.g. {"claude-haiku-5-5":{"input":0.1,"output":0.5}}.
 *
 * Cache reads bill at 0.1× input and 5-minute cache writes at 1.25× input.
 * Thinking tokens are included in output_tokens, so they're counted.
 */
export interface ModelPrice {
  input: number;
  output: number;
}

const DEFAULT_PRICES: Record<string, ModelPrice> = {
  "claude-fable-5-1": { input: 10, output: 50 },
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

let overrides: Record<string, ModelPrice> | null = null;
function prices(): Record<string, ModelPrice> {
  if (overrides === null) {
    overrides = {};
    if (env.AI_PRICES_JSON) {
      try {
        overrides = JSON.parse(env.AI_PRICES_JSON) as Record<string, ModelPrice>;
      } catch {
        console.warn("[aiPricing] AI_PRICES_JSON is not valid JSON — ignoring");
      }
    }
  }
  return { ...DEFAULT_PRICES, ...overrides };
}

export function priceFor(model: string): ModelPrice | null {
  return prices()[model] ?? null;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

/** Cost in millionths of a dollar (integer). Unknown models cost 0. */
export function costMicros(model: string, u: TokenUsage): number {
  const p = priceFor(model);
  if (!p) return 0;
  // $/MTok × tokens = micro-dollars.
  const micros =
    u.inputTokens * p.input +
    u.outputTokens * p.output +
    u.cacheReadTokens * p.input * 0.1 +
    u.cacheWriteTokens * p.input * 1.25;
  return Math.round(micros);
}
