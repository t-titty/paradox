import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "../env.js";

/**
 * The Oracle analyses each Crucible-phase message for logical fallacies or
 * distinctively strong reasoning. The prompt is kept byte-stable so the
 * Anthropic prompt cache gets a prefix hit — only the user's message varies.
 */

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const FALLACY_TYPES = [
  "ad_hominem",
  "straw_man",
  "false_dichotomy",
  "slippery_slope",
  "appeal_to_authority",
  "appeal_to_emotion",
  "circular_reasoning",
  "hasty_generalization",
  "red_herring",
  "tu_quoque",
  "no_true_scotsman",
  "whataboutism",
] as const;
export type FallacyType = (typeof FALLACY_TYPES)[number];

export type OracleVerdict =
  | { kind: "fallacy"; fallacyType: FallacyType; explanation: string }
  | { kind: "strong_logic"; explanation: string }
  | { kind: "clean" };

const verdictSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("fallacy"),
    fallacy_type: z.enum(FALLACY_TYPES),
    explanation: z.string().min(10).max(400),
  }),
  z.object({
    kind: z.literal("strong_logic"),
    explanation: z.string().min(10).max(400),
  }),
  z.object({
    kind: z.literal("clean"),
  }),
]);

const SYSTEM_PROMPT = `You are the Oracle in PARADOX, a live debate platform. You read a single debate message and return ONE of three verdicts in bare JSON.

## Verdicts

1. FALLACY — the message commits an informal logical fallacy. Choose one:
   ad_hominem, straw_man, false_dichotomy, slippery_slope, appeal_to_authority,
   appeal_to_emotion, circular_reasoning, hasty_generalization, red_herring,
   tu_quoque, no_true_scotsman, whataboutism.
   Output: {"kind":"fallacy","fallacy_type":"...","explanation":"one or two sentences describing the specific move, in under 400 chars"}

2. STRONG_LOGIC — the message deploys distinctively strong reasoning: a clean
   steelman, a precise distinction, a load-bearing concession, a well-formed
   reductio, an honest disanalogy. NOT merely polite, NOT merely confident —
   must be a real logical move.
   Output: {"kind":"strong_logic","explanation":"one or two sentences naming the move"}

3. CLEAN — the message is ordinary debate contribution with no notable
   fallacy and no standout logical strength. This is the most common verdict.
   Output: {"kind":"clean"}

## Rules

- You see the TARGET message, plus up to four earlier messages from the same
  debate as context. Judge ONLY the target message. Use the context to tell a
  fair summary of the opponent's view from a straw man, and a pointed
  question from an insult — never flag the target for something an earlier
  message did.
- If in doubt, return "clean". False positives are worse than misses.
- Do not flag disagreement or strong tone as a fallacy. Heat is not fallacy.
- Do not flag every rhetorical flourish as "strong_logic". The bar is
  technical — a specific logical move that a debate coach would praise.
- Output EXACTLY one JSON object. No prose. No markdown fences.`;

export interface ContextMessage {
  /** "A" or "B" — which debater wrote it. Names are withheld. */
  speaker: "A" | "B";
  text: string;
}

/**
 * Classify one Crucible message. Runs on ORACLE_FAST_MODEL (a small, fast
 * model) because it sits on the hot path of every duel message — the
 * opponent's copy is held until this verdict arrives so ad hominem can be
 * redacted before they see it.
 */
export async function analyzeMessage(
  text: string,
  context: ContextMessage[] = [],
  targetSpeaker: "A" | "B" = "A",
): Promise<OracleVerdict> {
  const recent = context.slice(-4);
  const contextBlock =
    recent.length > 0
      ? `Earlier messages (context only):\n${recent.map((m) => `[${m.speaker}] ${m.text}`).join("\n")}\n\n`
      : "";
  const userContent = `${contextBlock}TARGET message from debater ${targetSpeaker}:\n"${text}"`;

  const params: Anthropic.MessageCreateParamsNonStreaming & {
    output_config?: { effort: string };
  } = {
    model: env.ORACLE_FAST_MODEL,
    // Room for adaptive thinking on current small models; the JSON itself is tiny.
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  };
  // Classification doesn't need deep thought — keep it fast. Configurable
  // (set ORACLE_FAST_EFFORT="" to omit for models without effort support).
  if (env.ORACLE_FAST_EFFORT) params.output_config = { effort: env.ORACLE_FAST_EFFORT };

  try {
    const response = await client.messages.create(params);

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return parseVerdict(raw);
  } catch (e) {
    // Never let Oracle failures break the duel — fall back to "clean" and log.
    if (env.NODE_ENV !== "production") {
      console.warn("[fallacy] oracle call failed, treating as clean:", e);
    }
    return { kind: "clean" };
  }
}

function parseVerdict(text: string): OracleVerdict {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return { kind: "clean" };

  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { kind: "clean" };
  }

  const parsed = verdictSchema.safeParse(raw);
  if (!parsed.success) return { kind: "clean" };

  const v = parsed.data;
  if (v.kind === "fallacy") {
    return { kind: "fallacy", fallacyType: v.fallacy_type, explanation: v.explanation };
  }
  if (v.kind === "strong_logic") {
    return { kind: "strong_logic", explanation: v.explanation };
  }
  return { kind: "clean" };
}
