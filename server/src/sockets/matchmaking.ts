import type { Choice } from "@prisma/client";
import type { Server } from "socket.io";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { duelsOpen, parseYmd, resolvePhase } from "../phases.js";
import type { TribeName } from "../lib/oracle.js";
import { MIN_OPPOSITION_FOR_MATCH, oppositionScore } from "../lib/pairing.js";
import { isInEchoChamber } from "../lib/gamification.js";
import { canPair, schoolCircleIds } from "../lib/circleSafety.js";
import { BOT_LABEL, ensureBotUser, sparringTribeFor } from "../lib/bots.js";
import { ensurePracticeParadox } from "../lib/schedule.js";
import { PRACTICE_TIMING } from "../lib/duelPhases.js";
import { buildSnapshot, startDuel, type DuelEntrant } from "./duel.js";
import { duelRegistry } from "./duelRegistry.js";
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
  /** School circles (minors). Only ever matched within a shared school circle. */
  schoolCircleIds: string[];
}

// Test mode shortens the queue wait so testers don't sit on it.
const QUEUE_TIMEOUT_MS = (env.TEST_MODE ? 30 : 120) * 1000;

/**
 * In-memory matchmaking queue. One entry per user — re-joining while already
 * queued is a no-op. On each join we try to pair with the best available
 * opponent in the queue; if no good match exists, we wait. When the queue
 * times out the player is offered the AI sparring partner instead.
 */
class MatchmakingQueue {
  private entries = new Map<string, QueueEntry>();

  has(userId: string): boolean {
    return this.entries.has(userId);
  }

  get(userId: string): QueueEntry | undefined {
    return this.entries.get(userId);
  }

  size(): number {
    return this.entries.size;
  }

  values(): IterableIterator<QueueEntry> {
    return this.entries.values();
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

  private eligible(seeker: QueueEntry, entry: QueueEntry): boolean {
    if (entry.userId === seeker.userId) return false;
    if (entry.paradoxId !== seeker.paradoxId) return false;
    // Echo Chamber: a low-civility user may only match another low-civility
    // user, and vice-versa. Keeps clean duels clean; contains the chaos.
    if (entry.inEchoChamber !== seeker.inEchoChamber) return false;
    // School circles: minors only meet classmates.
    return canPair(seeker.schoolCircleIds, entry.schoolCircleIds);
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
      if (!this.eligible(seeker, entry)) continue;
      const score = oppositionScore(seeker.tribe, entry.tribe);
      if (score < MIN_OPPOSITION_FOR_MATCH) continue;
      if (score > bestScore || (score === bestScore && best && entry.joinedAt < best.joinedAt)) {
        best = entry;
        bestScore = score;
      }
    }
    return best;
  }

  /** Long-waiters get more generous matching — after 60s, any eligible match works. */
  findAnyMatch(seekerUserId: string): QueueEntry | null {
    const seeker = this.entries.get(seekerUserId);
    if (!seeker) return null;
    for (const entry of this.entries.values()) {
      if (this.eligible(seeker, entry)) return entry;
    }
    return null;
  }
}

const queue = new MatchmakingQueue();

interface Eligibility {
  paradox: { id: string; title: string; description: string; optionA: string; optionB: string };
  vote: { tribeAssigned: TribeName; choice: Choice };
  civilityScore: number;
  schoolCircleIds: string[];
}

/** Shared checks for queueing and sparring: voted + sorted on today's paradox. */
async function checkEligibility(
  io: Io,
  userId: string,
  socketId: string,
): Promise<Eligibility | null> {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return null;

  const phase = resolvePhase();
  if (!duelsOpen(phase)) {
    emitStatus(socket, {
      state: "ineligible",
      reason: "The arena opens when the Vow closes. Cast your vow first.",
    });
    return null;
  }

  const airDate = parseYmd(phase.today);
  const paradox = await prisma.paradox.findUnique({
    where: { airDate },
    select: { id: true, title: true, description: true, optionA: true, optionB: true },
  });
  if (!paradox) {
    emitStatus(socket, { state: "ineligible", reason: "No paradox scheduled for today." });
    return null;
  }

  const [vote, user, circles] = await Promise.all([
    prisma.vote.findUnique({ where: { userId_paradoxId: { userId, paradoxId: paradox.id } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { civilityScore: true } }),
    schoolCircleIds(userId),
  ]);
  if (!vote) {
    emitStatus(socket, { state: "ineligible", reason: "You did not vow. No tribe, no duel." });
    return null;
  }
  if (!vote.tribeAssigned) {
    emitStatus(socket, {
      state: "ineligible",
      reason: "The Oracle is still reading you. Try again in a few seconds.",
    });
    return null;
  }
  if (!user) {
    emitStatus(socket, { state: "ineligible", reason: "Account not found." });
    return null;
  }
  return {
    paradox,
    vote: { tribeAssigned: vote.tribeAssigned as TribeName, choice: vote.choice },
    civilityScore: user.civilityScore,
    schoolCircleIds: circles,
  };
}

/** If the player is already mid-duel, hand them back to it instead. */
function resumeIfInDuel(io: Io, userId: string, socketId: string): boolean {
  const live = duelRegistry.getForUser(userId);
  if (!live || live.ended) return false;
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    void socket.join(`duel:${live.duelId}`);
    socket.emit("duel:snapshot", buildSnapshot(live, userId));
  }
  return true;
}

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
  if (resumeIfInDuel(io, userId, socketId)) return;

  if (queue.has(userId)) {
    const existing = queue.get(userId)!;
    emitStatus(socket, {
      state: "queued",
      since: new Date(existing.joinedAt).toISOString(),
      queueSize: queue.size(),
      echoChamber: existing.inEchoChamber,
    });
    return;
  }

  const elig = await checkEligibility(io, userId, socketId);
  if (!elig) return;
  const { paradox, vote } = elig;

  const inEchoChamber = isInEchoChamber(elig.civilityScore);
  const choiceText = vote.choice === "A" ? paradox.optionA : paradox.optionB;

  const timeoutHandle = setTimeout(() => {
    const entry = queue.remove(userId);
    if (!entry) return;
    const s = io.sockets.sockets.get(entry.socketId);
    // No human opposite turned up — offer the AI sparring partner.
    if (s) emitStatus(s, { state: "timeout", sparAvailable: true });
  }, QUEUE_TIMEOUT_MS);

  const entry: QueueEntry = {
    userId,
    username,
    socketId,
    tribe: vote.tribeAssigned,
    choice: vote.choice,
    choiceText,
    paradoxId: paradox.id,
    paradoxTitle: paradox.title,
    paradoxDescription: paradox.description,
    joinedAt: Date.now(),
    timeoutHandle,
    inEchoChamber,
    schoolCircleIds: elig.schoolCircleIds,
  };
  queue.add(entry);

  // Widen candidate pool for anyone waiting longer than 60s — this prevents
  // niche-tribe users from waiting forever when only a few people are online.
  const match = hasLongWaiter() ? queue.findAnyMatch(userId) : queue.findBestMatch(userId);

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

  await startDuel(io, toEntrant(entry), toEntrant(match), { kind: "pvp", scored: true });
}

function toEntrant(e: QueueEntry): DuelEntrant {
  return {
    userId: e.userId,
    username: e.username,
    socketId: e.socketId,
    tribe: e.tribe,
    choice: e.choice,
    choiceText: e.choiceText,
    paradoxId: e.paradoxId,
    paradoxTitle: e.paradoxTitle,
    paradoxDescription: e.paradoxDescription,
    schoolCircleIds: e.schoolCircleIds,
  };
}

/**
 * Duel the AI sparring partner on today's paradox. The partner comes from
 * the tribe most opposed to the player's and defends the other option.
 * The first spar of the day is scored at half rate; later ones are for fun.
 */
export async function handleSpar(io: Io, userId: string, username: string, socketId: string): Promise<void> {
  if (resumeIfInDuel(io, userId, socketId)) return;
  queue.remove(userId);
  const elig = await checkEligibility(io, userId, socketId);
  if (!elig) return;
  const { paradox, vote } = elig;

  const priorSpars = await prisma.duel.count({
    where: { userAId: userId, paradoxId: paradox.id, kind: "spar" },
  });

  const aiTribe = sparringTribeFor(vote.tribeAssigned);
  const bot = await ensureBotUser(aiTribe);
  const aiChoice: Choice = vote.choice === "A" ? "B" : "A";

  const base = {
    paradoxId: paradox.id,
    paradoxTitle: paradox.title,
    paradoxDescription: paradox.description,
  };
  await startDuel(
    io,
    {
      ...base,
      userId,
      username,
      socketId,
      tribe: vote.tribeAssigned,
      choice: vote.choice,
      choiceText: vote.choice === "A" ? paradox.optionA : paradox.optionB,
      schoolCircleIds: elig.schoolCircleIds,
    },
    {
      ...base,
      userId: bot.id,
      username: BOT_LABEL[aiTribe],
      socketId: null,
      tribe: aiTribe,
      choice: aiChoice,
      choiceText: aiChoice === "A" ? paradox.optionA : paradox.optionB,
      isBot: true,
    },
    { kind: "spar", scored: priorSpars === 0 },
  );
}

/**
 * First-run practice: a compressed 4-minute spar on the tutorial paradox,
 * using the player's practice vow. Nothing is scored.
 */
export async function handlePractice(
  io: Io,
  userId: string,
  username: string,
  socketId: string,
): Promise<void> {
  const socket = io.sockets.sockets.get(socketId);
  if (!socket) return;
  if (resumeIfInDuel(io, userId, socketId)) return;
  queue.remove(userId);

  const paradox = await ensurePracticeParadox();
  const vote = await prisma.vote.findUnique({
    where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
  });
  if (!vote || !vote.tribeAssigned) {
    emitStatus(socket, { state: "ineligible", reason: "Cast your practice vow first." });
    return;
  }
  const tribe = vote.tribeAssigned as TribeName;
  const aiTribe = sparringTribeFor(tribe);
  const bot = await ensureBotUser(aiTribe);
  const aiChoice: Choice = vote.choice === "A" ? "B" : "A";
  const base = {
    paradoxId: paradox.id,
    paradoxTitle: paradox.title,
    paradoxDescription: paradox.description,
  };

  await startDuel(
    io,
    {
      ...base,
      userId,
      username,
      socketId,
      tribe,
      choice: vote.choice,
      choiceText: vote.choice === "A" ? paradox.optionA : paradox.optionB,
    },
    {
      ...base,
      userId: bot.id,
      username: BOT_LABEL[aiTribe],
      socketId: null,
      tribe: aiTribe,
      choice: aiChoice,
      choiceText: aiChoice === "A" ? paradox.optionA : paradox.optionB,
      isBot: true,
    },
    { kind: "practice", scored: false, timing: PRACTICE_TIMING },
  );
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
  for (const e of queue.values()) {
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
