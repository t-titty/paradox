import type { Server } from "socket.io";
import { prisma } from "../db.js";
import { env } from "../env.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  UserStatsDTO,
} from "../sockets/types.js";

type Io = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Gamification state lives on the User row. Every mutation returns the fresh
 * stats object and pushes `user:update` on every socket that belongs to that
 * user, so the header WP/Civility counters reflect changes without polling.
 *
 * Civility floor is 0, ceiling 100. Wisdom Points have no cap.
 */

export const AWARDS = {
  OPPONENT_ACKNOWLEDGED_YOU: 10,
  COMPLETED_DUEL: 5,
  BOTH_SIGNED_SYNTHESIS: 20,
  /** Oracle marks a Crucible message as strong logic. Capped per duel. */
  GOLD_STAR: 3,
  /** Finished a duel (≥3 messages sent) without a single Red Flag. */
  CLEAN_DUEL: 5,
} as const;

export const PENALTIES = {
  GHOSTED_DUEL: 20,
  AD_HOMINEM_DETECTED: 10,
  FAILED_BRIDGE_WINDOW: 5,
  /** WP lost per non-ad-hominem fallacy in the Crucible. Capped per duel. */
  RED_FLAG_WP: 2,
} as const;

/** Most Gold Stars / Red Flags that move WP in a single duel. */
export const MAX_SCORED_MARKS_PER_DUEL = 5;

/** Spars against the AI pay half (rounded down, minimum 1). */
export function sparScale(amount: number, isSpar: boolean): number {
  return isSpar ? Math.max(1, Math.floor(amount / 2)) : amount;
}

export async function awardWisdomPoints(
  io: Io,
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  if (amount <= 0) return;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { wisdomPoints: { increment: amount } },
    select: { wisdomPoints: true, civilityScore: true, isPremium: true },
  });
  broadcast(io, userId, {
    wisdomPoints: user.wisdomPoints,
    civilityScore: user.civilityScore,
    isPremium: user.isPremium,
    lastChange: { kind: "wp", delta: amount, reason },
  });
}

export async function deductWisdomPoints(
  io: Io,
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  if (amount <= 0) return;
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { wisdomPoints: true },
  });
  if (!current) return;
  const applied = Math.min(amount, current.wisdomPoints);
  if (applied <= 0) return;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { wisdomPoints: { decrement: applied } },
    select: { wisdomPoints: true, civilityScore: true, isPremium: true },
  });
  broadcast(io, userId, {
    wisdomPoints: user.wisdomPoints,
    civilityScore: user.civilityScore,
    isPremium: user.isPremium,
    lastChange: { kind: "wp", delta: -applied, reason },
  });
}

export async function deductCivility(
  io: Io,
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  if (amount <= 0) return;
  // Clamp at 0 — no negative civility.
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { civilityScore: true },
  });
  if (!current) return;
  const nextScore = Math.max(0, current.civilityScore - amount);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { civilityScore: nextScore },
    select: { wisdomPoints: true, civilityScore: true, isPremium: true },
  });
  broadcast(io, userId, {
    wisdomPoints: user.wisdomPoints,
    civilityScore: user.civilityScore,
    isPremium: user.isPremium,
    lastChange: { kind: "civility", delta: -amount, reason },
  });
}

/** Raise civility (capped at 100). Used for clean conduct. */
export async function restoreCivility(
  io: Io,
  userId: string,
  amount: number,
  reason: string,
): Promise<void> {
  if (amount <= 0) return;
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { civilityScore: true },
  });
  if (!current || current.civilityScore >= 100) return;
  const nextScore = Math.min(100, current.civilityScore + amount);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { civilityScore: nextScore },
    select: { wisdomPoints: true, civilityScore: true, isPremium: true },
  });
  broadcast(io, userId, {
    wisdomPoints: user.wisdomPoints,
    civilityScore: user.civilityScore,
    isPremium: user.isPremium,
    lastChange: { kind: "civility", delta: nextScore - current.civilityScore, reason },
  });
}

/**
 * True when the user's civility has fallen into the Echo Chamber. The
 * matchmaker uses this to partition the queue.
 */
export function isInEchoChamber(civilityScore: number): boolean {
  return civilityScore <= env.ECHO_CHAMBER_THRESHOLD;
}

function broadcast(io: Io, userId: string, stats: UserStatsDTO): void {
  // Socket.io has no cheap "all sockets for a user" primitive, so we fan out
  // over the connected socket set. This is fine — concurrent connections per
  // user are near-zero (one browser tab in practice).
  for (const [, socket] of io.sockets.sockets) {
    if (socket.data.userId === userId) {
      socket.emit("user:update", stats);
    }
  }
}
