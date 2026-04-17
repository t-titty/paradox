import type { Choice } from "@prisma/client";
import type { TribeName } from "../lib/oracle.js";
import type { CombatMode } from "../lib/duelPhases.js";
import type { OracleVerdict } from "../lib/fallacy.js";

export interface DuelMessageDTO {
  id: string;
  userId: string;
  username: string;
  text: string;
  mode: CombatMode;
  sentAt: string;
  verdict: OracleVerdict | null;
}

export interface AcknowledgementDTO {
  userId: string;
  username: string;
  text: string;
  at: string;
}

export interface OpponentDTO {
  userId: string;
  username: string;
  tribe: TribeName;
  choice: Choice;
  choiceText: string;
}

export interface SelfDuelInfoDTO {
  userId: string;
  username: string;
  tribe: TribeName;
  choice: Choice;
  choiceText: string;
}

export interface DuelSnapshotDTO {
  duelId: string;
  paradoxId: string;
  paradoxTitle: string;
  paradoxDescription: string;
  startedAt: string;
  duelEndsAt: string;
  nextTransitionAt: string | null;
  mode: CombatMode;
  you: SelfDuelInfoDTO;
  opponent: OpponentDTO;
  messages: DuelMessageDTO[];
  acknowledgements: AcknowledgementDTO[];
  /** userIds that have clicked "Request Extension" */
  extensionRequests: string[];
  endedAt: string | null;
}

export type MatchmakingStatus =
  | { state: "idle" }
  | { state: "queued"; since: string; queueSize: number; echoChamber: boolean }
  | { state: "matched"; duelId: string }
  | { state: "timeout" }
  | { state: "ineligible"; reason: string };

export interface EndReason {
  kind: "timer" | "ghost" | "extension_granted";
  message: string;
}

export type SynthesisStateDTO =
  | { kind: "none" }
  | { kind: "pending" }
  | { kind: "ready"; text: string; generatedAt: string }
  | { kind: "signed_partial"; text: string; generatedAt: string; signedByUserIds: string[] }
  | { kind: "signed_both"; text: string; generatedAt: string; signedAt: string; archiveId: string }
  | { kind: "declined"; reason: string };

export interface UserStatsDTO {
  wisdomPoints: number;
  civilityScore: number;
  isPremium: boolean;
  lastChange?: { kind: "wp" | "civility"; delta: number; reason: string };
}

/* =========================================================================
 * Typed event maps for Socket.io generics.
 * ========================================================================= */

export interface ClientToServerEvents {
  "matchmaking:join": () => void;
  "matchmaking:leave": () => void;

  "duel:hello": (duelId: string) => void;
  "duel:message": (payload: { duelId: string; text: string }) => void;
  "duel:acknowledge": (payload: { duelId: string; text: string }) => void;
  "duel:request_extension": (payload: { duelId: string }) => void;

  "synthesis:sign": (payload: { duelId: string }) => void;
  "synthesis:decline": (payload: { duelId: string }) => void;
}

export interface ServerToClientEvents {
  "matchmaking:status": (status: MatchmakingStatus) => void;
  "matchmaking:matched": (snapshot: DuelSnapshotDTO) => void;

  "duel:snapshot": (snapshot: DuelSnapshotDTO) => void;
  "duel:message": (message: DuelMessageDTO) => void;
  "duel:phase_change": (payload: { mode: CombatMode; nextTransitionAt: string | null }) => void;
  "duel:acknowledge_update": (payload: { acknowledgements: AcknowledgementDTO[] }) => void;
  "duel:extension_update": (payload: { extensionRequests: string[]; granted: boolean }) => void;
  "duel:ended": (payload: { duelId: string; reason: EndReason; endedAt: string }) => void;
  "duel:error": (payload: { code: string; message: string }) => void;

  "synthesis:update": (payload: { duelId: string; state: SynthesisStateDTO }) => void;
  "user:update": (stats: UserStatsDTO) => void;
}

export interface SocketData {
  userId: string;
  username: string;
}

export interface InterServerEvents {
  /* unused but required by socket.io generics */
  ping: () => void;
}
