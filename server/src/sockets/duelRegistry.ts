import type { Choice } from "@prisma/client";
import type { TribeName } from "../lib/oracle.js";
import type { CombatMode } from "../lib/duelPhases.js";
import type { OracleVerdict } from "../lib/fallacy.js";

/**
 * In-memory registry for live duels. Each duel holds the authoritative state
 * (transcript, acks, extension clicks) and its scheduled phase/end timers.
 *
 * The DB has an immutable record of the final transcript once a duel ends.
 * While it's running, this Map is the source of truth.
 */

export interface DuelParticipant {
  userId: string;
  username: string;
  tribe: TribeName;
  choice: Choice;
  choiceText: string;
}

export interface DuelMessageEntry {
  id: string;
  userId: string;
  username: string;
  text: string;
  mode: CombatMode;
  sentAt: string;
  verdict: OracleVerdict | null;
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

export interface LiveDuel {
  duelId: string;
  paradoxId: string;
  paradoxTitle: string;
  paradoxDescription: string;
  startedAt: Date;
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
  synthesis: SynthesisState;
  /** Per-user ad-hominem counts this duel — used for civility deduction dedupe. */
  adHominemAwards: Set<string>;
}

class DuelRegistry {
  private duels = new Map<string, LiveDuel>();
  private userToDuel = new Map<string, string>();

  register(duel: LiveDuel): void {
    this.duels.set(duel.duelId, duel);
    this.userToDuel.set(duel.userA.userId, duel.duelId);
    this.userToDuel.set(duel.userB.userId, duel.duelId);
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
    this.userToDuel.delete(duel.userA.userId);
    this.userToDuel.delete(duel.userB.userId);
    for (const t of duel.phaseTimers) clearTimeout(t);
    for (const t of duel.disconnectTimers.values()) clearTimeout(t);
    this.duels.delete(duelId);
  }
}

export const duelRegistry = new DuelRegistry();
