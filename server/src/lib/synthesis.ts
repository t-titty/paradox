import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";
import type { DuelMessageEntry } from "../sockets/duelRegistry.js";
import { recordAiUsage } from "./aiUsage.js";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * After a duel ends (by timer or mutual extension request), the Oracle
 * reads the full transcript and returns 2-3 sentences that bridge the two
 * positions. The statement is shown to both users; if both sign it, it
 * lands in the public Global Archive.
 *
 * Prompt is stable; only the transcript varies, so prompt caching hits on
 * the system block from duel to duel.
 */

const SYSTEM_PROMPT = `You are the Oracle in PARADOX. You have just read a 10-minute debate transcript between two users from opposing philosophical tribes. Your job: produce a Synthesis Statement that bridges their perspectives fairly.

## Rules

- Exactly 2 or 3 sentences.
- Do NOT take a side, award a winner, or restate one position as "correct."
- Name the real tension between the two positions in your own words.
- Identify the principle or concern that BOTH sides, on reflection, share.
- Use neutral, precise language. No therapy-speak. No platitudes.
- Do NOT quote the transcript verbatim.
- Do NOT mention "both sides" as a phrase — that is lazy. Name the specific tribes or specific concerns.
- Output bare text only. No preface, no JSON, no markdown.
- Length: 40 to 120 words total.

If the transcript is too thin to produce a real synthesis (very few messages, or entirely off-topic), return exactly: NO_SYNTHESIS

That token and nothing else. It will trigger a graceful "no bridge was built" state.`;

export type SynthesisResult =
  | { kind: "synthesis"; text: string }
  | { kind: "no_synthesis" };

interface SynthesisArgs {
  paradoxTitle: string;
  paradoxDescription: string;
  userAId: string;
  userBId: string;
  tribeA: string;
  tribeB: string;
  userAChoice: string;
  userBChoice: string;
  messages: DuelMessageEntry[];
}

export async function generateSynthesis(args: SynthesisArgs): Promise<SynthesisResult> {
  const tribeFor = (userId: string) => (userId === args.userAId ? args.tribeA : args.tribeB);
  const transcriptText = args.messages
    .map((m) => `[${m.mode.toUpperCase()}] ${m.username} (${tribeFor(m.userId)}): ${m.text}`)
    .join("\n");

  const userMessage = [
    `Paradox: ${args.paradoxTitle}`,
    args.paradoxDescription,
    ``,
    `User A chose: "${args.userAChoice}" — tribe: ${args.tribeA}`,
    `User B chose: "${args.userBChoice}" — tribe: ${args.tribeB}`,
    ``,
    `Transcript:`,
    transcriptText || "(no messages were sent)",
  ].join("\n");

  try {
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });
    recordAiUsage("synthesis", env.ANTHROPIC_MODEL, response.usage);

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (text.startsWith("NO_SYNTHESIS")) return { kind: "no_synthesis" };
    if (text.length < 30) return { kind: "no_synthesis" };
    return { kind: "synthesis", text };
  } catch (e) {
    if (env.NODE_ENV !== "production") {
      console.warn("[synthesis] oracle failed:", e);
    }
    return { kind: "no_synthesis" };
  }
}

