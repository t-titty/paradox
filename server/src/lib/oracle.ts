import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "../env.js";
import { HttpError } from "../middleware/error.js";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const TRIBES = [
  "Utilitarian",
  "Deontologist",
  "VirtueEthicist",
  "Nihilist",
  "Stoic",
  "Existentialist",
  "Hedonist",
] as const;
export type TribeName = (typeof TRIBES)[number];

const tribeResultSchema = z.object({
  tribe: z.enum(TRIBES),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("How strongly the justification fits the chosen tribe. 0.5 = marginal."),
  reasoning: z
    .string()
    .min(20)
    .max(600)
    .describe(
      "2-3 sentences explaining which philosophical patterns in the text pointed to this tribe. Do not quote the user verbatim.",
    ),
});

export type TribeResult = z.infer<typeof tribeResultSchema>;

// Stable system prompt — kept byte-identical across calls so prompt caching
// gets a prefix hit. Edits here invalidate the cache for all users.
const SYSTEM_PROMPT = `You are the Oracle in PARADOX, a daily ethical-debate platform.

Your job: read a user's one-sentence justification for how they resolved a moral
dilemma, and sort them into exactly one of seven philosophical tribes. You must
base your judgement on the deep pattern of reasoning, not surface keywords.

## The Seven Tribes

Utilitarian — maximizes aggregate welfare. Weighs outcomes; numbers matter;
  "greatest good for the greatest number." Sacrifices the one for the many
  without flinching if the math says so.

Deontologist — holds to duty, rights, and rules regardless of consequence.
  "Some things are wrong even if they lead to good outcomes." Treats persons
  as ends, never merely as means.

VirtueEthicist — asks "what would a person of excellent character do?"
  Focuses on traits (courage, honesty, compassion, integrity) rather than
  rules or outcomes. The right act flows from the right kind of person.

Nihilist — rejects objective moral ground. "None of this ultimately matters."
  May act anyway, but denies that the action carries cosmic weight. Often
  detached, ironic, or resigned.

Stoic — accepts what cannot be controlled; acts from reason and discipline
  rather than passion. Duty and endurance over outcome. Distinguishes what
  is "up to us" from what is not.

Existentialist — centers radical freedom and the authorship of meaning.
  Choices create the self. Emphasizes authenticity, anguish, responsibility,
  and the refusal of bad faith.

Hedonist — orients toward pleasure, joy, and the avoidance of suffering as
  primary goods. Can be thoughtful (eudaimonic) or crude. Outcomes matter
  but are measured in felt experience, not abstract welfare.

## Rules

- Return exactly one tribe. No fence-sitting. If the text genuinely spans
  two, pick the dominant thread and lower the confidence accordingly.
- Confidence 0.85+ means the sentence is a paradigm case. 0.55-0.7 means
  the signal is clear but thin. Below 0.55 means you are guessing — be
  honest about that.
- The reasoning field is read by the user. Be specific about the linguistic
  and logical moves that drove your decision. Do NOT quote them back to
  themselves verbatim. Do NOT moralize or praise.
- Ignore the user's binary choice (A or B). Two users can land in the same
  tribe while voting opposite sides; two users can vote the same side from
  different tribes. Judge the reasoning, not the verdict.

## Output format

Respond with a single JSON object and nothing else — no prose, no markdown
fences, no surrounding whitespace commentary. Shape:

{"tribe": "Utilitarian" | "Deontologist" | "VirtueEthicist" | "Nihilist" | "Stoic" | "Existentialist" | "Hedonist",
 "confidence": number between 0 and 1,
 "reasoning": "2 or 3 sentences, 20 to 600 characters"}`;

interface SortArgs {
  paradoxTitle: string;
  paradoxDescription: string;
  choiceText: string;
  justification: string;
}

export async function sortIntoTribe(args: SortArgs): Promise<TribeResult> {
  const userMessage = [
    `Paradox: ${args.paradoxTitle}`,
    ``,
    `${args.paradoxDescription}`,
    ``,
    `The user chose: "${args.choiceText}"`,
    ``,
    `Their one-sentence justification:`,
    `"${args.justification}"`,
  ].join("\n");

  try {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return parseOracleOutput(text);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      throw new HttpError(503, "The Oracle is resting. Try again in a moment.", "oracle_rate_limited");
    }
    if (e instanceof Anthropic.APIError) {
      throw new HttpError(502, `Oracle error: ${e.message}`, "oracle_api_error");
    }
    throw e;
  }
}

/**
 * The Oracle is instructed to return bare JSON, but some models occasionally
 * wrap it in ```json fences. Extract the first balanced {...} block and parse.
 */
function parseOracleOutput(text: string): TribeResult {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new HttpError(502, "Oracle returned no JSON object", "oracle_parse_failed");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new HttpError(502, "Oracle returned malformed JSON", "oracle_parse_failed");
  }

  const parsed = tribeResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(
      502,
      `Oracle output failed validation: ${parsed.error.message}`,
      "oracle_schema_failed",
    );
  }
  return parsed.data;
}
