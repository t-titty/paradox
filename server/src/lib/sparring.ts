import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";
import type { CombatMode } from "./duelPhases.js";
import type { TribeName } from "./oracle.js";
import { recordAiUsage } from "./aiUsage.js";

/**
 * The AI sparring partner. When no human opposite is available (or a new
 * player is practising), the Oracle plays an opponent from the tribe most
 * opposed to the player's, defending the other side of the dilemma.
 *
 * The system prompt is byte-stable for prompt caching; everything about the
 * specific duel goes in the user turn.
 */

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a sparring partner in PARADOX, a live ethical-debate game. You are an AI and the player knows it. You argue one side of a moral dilemma from the perspective of one philosophical tribe, against a human player from a different tribe.

## How to play

- Argue in good faith. Your job is to give the player a worthy, honest opponent — not to win at any cost and not to roll over.
- Speak from your assigned tribe's reasoning style (e.g. a Utilitarian reasons from outcomes; a Deontologist from duties and rights; a Stoic from what is in our control; an Existentialist from freedom and authorship of meaning; a Virtue Ethicist from character; a Hedonist from felt pleasure and suffering; a Nihilist from the absence of objective moral ground).
- Engage with what the player actually said. Quote nothing back verbatim; respond to their point.
- When the player makes a genuinely strong point, say so briefly and concede what deserves conceding — then say what still divides you.
- Never insult, mock, or psychoanalyse the player. Never use profanity. Never claim to be human.
- Keep every message short: 1 to 3 sentences, under 350 characters. Plain text only — no markdown, no lists, no quotation marks around your reply, no name prefix.

## Combat modes

- CLARIFICATION: ask exactly ONE genuine question that helps you understand the player's position. Your message MUST end with a question mark. Make no claims.
- CRUCIBLE: argue. Press on the weakest part of the player's reasoning, defend your own position, offer a concrete example or distinction.
- BRIDGE: look for common ground. Name a concern you both share and what would have to be true for you to move toward their view.

## Special tasks

If asked for an ACKNOWLEDGEMENT, write one sentence (20 to 250 characters) naming the most reasonable point the player made, in your own words. Plain text.`;

export interface SparContext {
  paradoxTitle: string;
  paradoxDescription: string;
  aiTribe: TribeName;
  aiChoiceText: string;
  playerTribe: TribeName;
  playerChoiceText: string;
  transcript: { fromAi: boolean; text: string; mode: CombatMode }[];
}

function contextBlock(ctx: SparContext): string {
  const lines = ctx.transcript
    .slice(-16)
    .map((m) => `[${m.mode.toUpperCase()}] ${m.fromAi ? "YOU" : "PLAYER"}: ${m.text}`);
  return [
    `Dilemma: ${ctx.paradoxTitle}`,
    ctx.paradoxDescription,
    ``,
    `You are a ${ctx.aiTribe}. You defend: "${ctx.aiChoiceText}".`,
    `The player is a ${ctx.playerTribe}. They chose: "${ctx.playerChoiceText}".`,
    ``,
    `Transcript so far:`,
    lines.length > 0 ? lines.join("\n") : "(nothing yet)",
  ].join("\n");
}

async function complete(userContent: string): Promise<string | null> {
  try {
    const response = await client.messages.create({
      model: env.SPAR_MODEL ?? env.ANTHROPIC_MODEL,
      max_tokens: 2000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userContent }],
    });
    recordAiUsage("spar", env.SPAR_MODEL ?? env.ANTHROPIC_MODEL, response.usage);
    if ((response.stop_reason as string) === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^["“]|["”]$/g, "")
      .trim();
    return text.length > 0 ? text : null;
  } catch (e) {
    console.warn("[spar] model call failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

const FALLBACK_QUESTIONS = [
  "What would have to be true for you to choose the other side?",
  "Which part of your choice matters most to you — the outcome, or the act itself?",
  "Who do you think bears the cost of your choice, and is that fair to them?",
];

/** The AI's next debate message for `mode`. Always returns something sendable. */
export async function sparReply(ctx: SparContext, mode: CombatMode): Promise<string> {
  const instruction =
    mode === "clarification"
      ? "Mode: CLARIFICATION. Ask your next single question. It must end with '?'."
      : mode === "crucible"
        ? "Mode: CRUCIBLE. Write your next argument."
        : "Mode: BRIDGE. Write your next message looking for common ground.";
  const raw = await complete(`${contextBlock(ctx)}\n\n${instruction}`);
  let text = (raw ?? "").slice(0, 400).trim();

  if (mode === "clarification") {
    if (!text.endsWith("?")) {
      const q = text.lastIndexOf("?");
      text = q > 10 ? text.slice(0, q + 1) : "";
    }
    if (!text) {
      text = FALLBACK_QUESTIONS[ctx.transcript.length % FALLBACK_QUESTIONS.length]!;
    }
  }
  if (!text) {
    text =
      mode === "bridge"
        ? "Whatever divides us, we both seem to care about who bears the cost of this choice."
        : "I'm not persuaded yet — tell me why the cost of your choice is worth paying.";
  }
  return text;
}

/** The AI's Bridge Window acknowledgement of the player's best point. */
export async function sparAcknowledgement(ctx: SparContext): Promise<string> {
  const raw = await complete(
    `${contextBlock(ctx)}\n\nTask: ACKNOWLEDGEMENT. Name the player's most reasonable point in one sentence.`,
  );
  const text = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  return text.length >= 10 ? text : "You were right that the people who bear the cost deserve a say in it.";
}
