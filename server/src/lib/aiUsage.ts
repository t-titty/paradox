import { prisma } from "../db.js";
import { costMicros, type TokenUsage } from "./aiPricing.js";

export type AiRole = "sort" | "fallacy" | "synthesis" | "spar";

interface SdkUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/**
 * Add one Anthropic call to today's rollup for the Open Books page.
 * Never throws — accounting must never break gameplay.
 */
export function recordAiUsage(role: AiRole, model: string, usage: SdkUsage | null | undefined): void {
  if (!usage) return;
  const u: TokenUsage = {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
  };
  const micros = BigInt(costMicros(model, u));
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  prisma.aiUsageDaily
    .upsert({
      where: { date_role_model: { date, role, model } },
      create: { date, role, model, calls: 1, ...u, costMicros: micros },
      update: {
        calls: { increment: 1 },
        inputTokens: { increment: u.inputTokens },
        outputTokens: { increment: u.outputTokens },
        cacheReadTokens: { increment: u.cacheReadTokens },
        cacheWriteTokens: { increment: u.cacheWriteTokens },
        costMicros: { increment: micros },
      },
    })
    .catch((e) => console.warn("[aiUsage] could not record usage:", e instanceof Error ? e.message : e));
}
