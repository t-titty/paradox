import type { Choice } from "@prisma/client";
import type { Server } from "socket.io";
import { prisma } from "../db.js";
import { parseYmd, resolvePhase } from "../phases.js";
import type { TribeName } from "../lib/oracle.js";
import { MIN_OPPOSITION_FOR_MATCH, oppositionScore } from "../lib/pairing.js";
import { isInEchoChamber } from "../lib/gamification.js";
import { startDuel } from "./duel.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  MatchmakingStatus,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

type Io = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

interface QueueEntry {
  userId: string;
  username: string;
  socketId: string;
  tribe: TribeName;
  choice: Choice;
  choiceText: string;
  paradoxId: string;
  paradoxTitle: string;
  paradoxDescription: string;
  joinedAt: number;
  timeoutHandle: NodeJS.Timeout;
  /** True when civility ≤ threshold. Echo Chamber users can only match each other. */
  inEchoChamber: boolean;
}

const QUEUE_TIMEOUT_MS = 120 * 1000;

/**
 * In-memory matchmaking queue. One entry per user — re-joining while already
 * queued is a no-op. On each join we try to pair with the best available
 * opponent in the queue; if no good match exists, we wait.
 */
class MatchmakingQueue {
  private entries = new Map<string, QueueEntry>();

  has(userId: string): boolean {
    return this.entries.has(userId);
  }

  size(): number {
    return this.entries.size;
  }

  add(entry: QueueEntry): void {
    this.entries.set(entry.userId, entry);
  }

  remove(userId: string): QueueEntry | undefined {
    const entry = this.entries.get(userId);
    if (entry) {
      clearTimeout(entry.timeoutHandle);
      this.entries.delete(userId);
    }
    return entry;
  }

  /**
   * Finds the best opponent for `seeker` — highest opposition score, ties
   * broken by longest wait. Returns null if no one scores at or above the
   * minimum threshold (seeker keeps waiting).
   */
  findBestMatch(seekerUserId: string): QueueEntry | null {
    const seeker = this.entries.get(seekerUserId);
    if (!seeker) return null;

    let best: QueueEntry | null = null;
    let bestScore = -1;

    for (const entry of this.entries.values()) {
      if (entry.userId === seekerUserId) continue;
      if (entry.paradoxId !== seeker.paradoxId) continue;
      // Echo Chamber: a low-civility user may only match another low-civility
      // user, and vice-versa. Keeps clean duels clean; contains the chaos.
      if (entry.inEchoChamber !== seeker.inEchoChamber) continue;
      const score = oppositionScore(seeker.tribe, entry.tribe);
      if (score < MIN_OPPOSITION_FOR_MATCH) continue;
      if (score > bestScore || (score === bestScore && best && entry.joinedAt < best.joinedAt)) {
        best = entry;
        bestScore = score;
      }
    }
    return best;
  }

  /** Long-waiters get more generous matching — after 60s, any non-self same-pool match works. */
  findAnyMatch(seekerUserId: string): QueueEntry | null {
    const seeker = this.entries.get(seekerUserId);
    if (!seeker) return null;
    for (const entry of this.entries.values()) {
      if (entry.userId === seekerUserId) continue;
      if (entry.paradoxId !== seeker.paradoxId) continue;
      if (entry.inEchoChamber !== seeker.inEchoChamber) continue;
      return entry;
    }
    return null;
  }
}

const queue = new MatchmakingQueue();

/**
 * Called when a user sends `matchmaking:join`. Validates they voted + were
 * sorted for today, then adds to queue and attempts pairing.
 */
export async function handleJoinQueue(
  io: Io,
  userId: string,
  username: string,
  socketId: string,
): Promise<void> {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;

  if (queue.has(userId)) {
    emitStatus(socket, {
      state: "queued",
      since: new Date().toISOString(),
      queueSize: queue.size(),
      echoChamber: queue["entries"].get(userId)?.inEchoChamber ?? false,
    });
    return;
  }

  const phase = resolvePhase();
  // Let users queue during "sort" and "duel" phases. Before sort closes, too
  // early. During bridge (overnight), last night's match window is long gone.
  if (phase.phase !== "duel" && phase.phase !== "sort") {
    emitStatus(socket, {
      state: "ineligible",
      reason: "Matchmaking is closed. Come back when the Duel bell rings.",
    });
    return;
  }

  const airDate = parseYmd(phase.today);
  const paradox = await prisma.paradox.findUnique({
    where: { airDate },
    select: { id: true, title: true, description: true, optionA: true, optionB: true },
  });
  if (!paradox) {
    emitStatus(socket, { state: "ineligible", reason: "No paradox scheduled for today." });
    return;
  }

  const [vote, user] = await Promise.all([
    prisma.vote.findUnique({ where: { userId_paradoxId: { userId, paradoxId: paradox.id } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { civilityScore: true } }),
  ]);
  if (!vote) {
    emitStatus(socket, { state: "ineligible", reason: "You did not vow. No tribe, no duel." });
    return;
  }
  if (!vote.tribeAssigned) {
    emitStatus(socket, {
      state: "ineligible",
      reason: "The Oracle has not read you yet. Visit the Sort first.",
    });
    return;
  }
  if (!user) {
    emitStatus(socket, { state: "ineligible", reason: "Account not found." });
    return;
  }

  const inEchoChamber = isInEchoChamber(user.civilityScore);
  const choiceText = vote.choice === "A" ? paradox.optionA : paradox.optionB;

  const timeoutHandle = setTimeout(() => {
    const entry = queue.remove(userId);
    if (!entry) return;
    const s = io.sockets.sockets.get(entry.socketId);
    if (s) emitStatus(s, { state: "timeout" });
  }, QUEUE_TIMEOUT_MS);

  const entry: QueueEntry = {
    userId,
    username,
    socketId,
    tribe: vote.tribeAssigned as TribeName,
    choice: vote.choice,
    choiceText,
    paradoxId: paradox.id,
    paradoxTitle: paradox.title,
    paradoxDescription: paradox.description,
    joinedAt: Date.now(),
    timeoutHandle,
    inEchoChamber,
  };
  queue.add(entry);

  // Widen candidate pool for anyone waiting longer than 60s — this prevents
  // niche-tribe users from waiting forever when only a few people are online.
  const widening = hasLongWaiter() ? "any" : "best";
  const match = widening === "any" ? queue.findAnyMatch(userId) : queue.findBestMatch(userId);

  if (!match) {
    emitStatus(socket, {
      state: "queued",
      since: new Date(entry.joinedAt).toISOString(),
      queueSize: queue.size(),
      echoChamber: entry.inEchoChamber,
    });
    return;
  }

  // Pull both out of queue atomically (still single-threaded, so this is safe).
  queue.remove(userId);
  queue.remove(match.userId);

  await startDuel(io, entry, match);
}

export function handleLeaveQueue(io: Io, userId: string): void {
  const entry = queue.remove(userId);
  if (!entry) return;
  const s = io.sockets.sockets.get(entry.socketId);
  if (s) emitStatus(s, { state: "idle" });
}

export function dropFromQueueOnDisconnect(userId: string): void {
  queue.remove(userId);
}

function hasLongWaiter(): boolean {
  const now = Date.now();
  for (const e of queue["entries"].values()) {
    if (now - e.joinedAt > 60 * 1000) return true;
  }
  return false;
}

function emitStatus(
  socket: { emit: (event: "matchmaking:status", status: MatchmakingStatus) => void },
  status: MatchmakingStatus,
): void {
  socket.emit("matchmaking:status", status);
}
