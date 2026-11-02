import type { Choice } from "@prisma/client";
import type { TribeName } from "../lib/oracle.js";
import type { CombatMode, DuelTiming } from "../lib/duelPhases.js";
import type { OracleVerdict } from "../lib/fallacy.js";

/**
 * In-memory registry for live duels. Each duel holds the authoritative state
 * (transcript, acks, extension clicks) and its scheduled phase/end timers.
 *
 * Every state change is also checkpointed to the Duel row (transcriptJson +
 * stateJson) so a restart or deploy can rebuild in-flight duels — see
 * duelRecovery.ts. The Map is still the source of truth while running.
 */

export type DuelKind = "pvp" | "spar" | "practice";

export interface DuelParticipant {
  userId: string;
  username: string;
  tribe: TribeName;
  choice: Choice;
  choiceText: string;
  /** True for the AI sparring partner. */
  isBot: boolean;
  /** School circles (minors) this player belongs to — drives safety rules. */
  schoolCircleIds: string[];
}

export interface DuelMessageEntry {
  id: string;
  userId: string;
  username: string;
  text: string;
  mode: CombatMode;
  sentAt: string;
  verdict: OracleVerdict | null;
  /** Ad hominem: the opponent only ever sees a redaction mark. */
  redacted: boolean;
  /** Whether the opponent has been sent this message yet. */
  delivered: boolean;
}

export interface AckEntry {
  userId: string;
  username: string;
  text: string;
  at: string;
}

export type SynthesisState =
  | { kind: "none" }
  | { kind: "pending" }
  | { kind: "ready"; text: string; generatedAt: Date }
  | { kind: "signed_partial"; text: string; generatedAt: Date; signedByUserIds: Set<string> }
  | { kind: "signed_both"; text: string; generatedAt: Date; signedAt: Date; archiveId: string }
  | { kind: "declined"; reason: string };

export interface MarkTally {
  gold: number;
  red: number;
}

export interface AiState {
  userId: string;
  busy: boolean;
  pending: boolean;
  lastMessageAt: number;
  prods: number;
}

export interface LiveDuel {
  duelId: string;
  paradoxId: string;
  paradoxTitle: string;
  paradoxDescription: string;
  startedAt: Date;
  kind: DuelKind;
  /** False for practice and repeat spars — nothing moves WP or civility. */
  scored: boolean;
  timing: DuelTiming;
  /** False when a school-circle player is involved: never shown publicly. */
  isPublic: boolean;
  userA: DuelParticipant;
  userB: DuelParticipant;
  messages: DuelMessageEntry[];
  /** userId → ack entry. Either user may ack only once. */
  acknowledgements: Map<string, AckEntry>;
  /** userIds who clicked Request Extension (only valid after both acked). */
  extensionRequests: Set<string>;
  ended: boolean;
  endedAt: Date | null;
  /** Handles so we can clear scheduled phase/end timers on early termination. */
  phaseTimers: NodeJS.Timeout[];
  /** userId → disconnect grace timer. Cleared on reconnect. */
  disconnectTimers: Map<string, NodeJS.Timeout>;
  /** messageId → fallback timer that delivers to the opponent if the Oracle is slow. */
  deliveryTimers: Map<string, NodeJS.Timeout>;
  synthesis: SynthesisState;
  /** Message ids already penalised for ad hominem (dedupe across replays). */
  adHominemAwards: Set<string>;
  /** userId → Gold Stars / Red Flags awarded this duel. */
  marks: Map<string, MarkTally>;
  /** userId → last message timestamp, for flood control. */
  lastMessageAt: Map<string, number>;
  /** Present when one side is the AI sparring partner. */
  ai: AiState | null;
}

class DuelRegistry {
  private duels = new Map<string, LiveDuel>();
  private userToDuel = new Map<string, string>();

  register(duel: LiveDuel): void {
    this.duels.set(duel.duelId, duel);
    this.userToDuel.set(duel.userA.userId, duel.duelId);
    // Bot accounts can be in many spars at once — never index them.
    if (!duel.userB.isBot) this.userToDuel.set(duel.userB.userId, duel.duelId);
  }

  get(duelId: string): LiveDuel | undefined {
    return this.duels.get(duelId);
  }

  getForUser(userId: string): LiveDuel | undefined {
    const duelId = this.userToDuel.get(userId);
    return duelId ? this.duels.get(duelId) : undefined;
  }

  unregister(duelId: string): void {
    const duel = this.duels.get(duelId);
    if (!duel) return;
    for (const u of [duel.userA.userId, duel.userB.userId]) {
      if (this.userToDuel.get(u) === duelId) this.userToDuel.delete(u);
    }
    for (const t of duel.phaseTimers) clearTimeout(t);
    for (const t of duel.disconnectTimers.values()) clearTimeout(t);
    for (const t of duel.deliveryTimers.values()) clearTimeout(t);
    this.duels.delete(duelId);
  }
}

export const duelRegistry = new DuelRegistry();
