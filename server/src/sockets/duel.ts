import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { prisma } from "../db.js";
import {
  STANDARD_TIMING,
  isValidMessageForMode,
  resolveMode,
  type CombatMode,
  type DuelTiming,
} from "../lib/duelPhases.js";
import { analyzeMessage, type ContextMessage, type OracleVerdict } from "../lib/fallacy.js";
import { generateSynthesis } from "../lib/synthesis.js";
import { sparAcknowledgement, sparReply, type SparContext } from "../lib/sparring.js";
import { containsProfanity } from "../lib/profanity.js";
import {
  AWARDS,
  MAX_SCORED_MARKS_PER_DUEL,
  PENALTIES,
  awardWisdomPoints,
  deductCivility,
  deductWisdomPoints,
  restoreCivility,
  sparScale,
} from "../lib/gamification.js";
import {
  duelRegistry,
  type AckEntry,
  type DuelKind,
  type DuelMessageEntry,
  type DuelParticipant,
  type LiveDuel,
  type MarkTally,
  type SynthesisState,
} from "./duelRegistry.js";
import type {
  ClientToServerEvents,
  DuelMessageDTO,
  DuelSnapshotDTO,
  EndReason,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  SynthesisStateDTO,
} from "./types.js";

type Io = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const DISCONNECT_GRACE_MS = 30 * 1000;
/** After a restart, players get longer to reconnect before it counts as a ghost. */
export const RECOVERY_GRACE_MS = 90 * 1000;
/** If the Oracle hasn't ruled on a message by now, deliver it anyway. */
const ORACLE_HOLD_MS = 4000;
/** Flood control between one player's messages. */
const MIN_MESSAGE_GAP_MS = 800;
/** Ended duels stay in memory this long so signatures can land. */
const POST_DUEL_RETENTION_MS = 10 * 60 * 1000;

let shuttingDown = false;
/** Called on SIGTERM: sockets are about to drop because of us, not the players. */
export function markShuttingDown(): void {
  shuttingDown = true;
}

export function roomName(duelId: string): string {
  return `duel:${duelId}`;
}

/** Every socket joins its user's room so we can address one player directly. */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export interface DuelEntrant {
  userId: string;
  username: string;
  /** Null for the AI sparring partner. */
  socketId: string | null;
  tribe: import("../lib/oracle.js").TribeName;
  choice: import("@prisma/client").Choice;
  choiceText: string;
  paradoxId: string;
  paradoxTitle: string;
  paradoxDescription: string;
  isBot?: boolean;
  schoolCircleIds?: string[];
}

export interface StartDuelOptions {
  kind: DuelKind;
  scored: boolean;
  timing?: DuelTiming;
}

export async function startDuel(
  io: Io,
  entryA: DuelEntrant,
  entryB: DuelEntrant,
  opts: StartDuelOptions = { kind: "pvp", scored: true },
): Promise<void> {
  const startedAt = new Date();
  const timing = opts.timing ?? STANDARD_TIMING;
  const toParticipant = (e: DuelEntrant): DuelParticipant => ({
    userId: e.userId,
    username: e.username,
    tribe: e.tribe,
    choice: e.choice,
    choiceText: e.choiceText,
    isBot: Boolean(e.isBot),
    schoolCircleIds: e.schoolCircleIds ?? [],
  });
  const userA = toParticipant(entryA);
  const userB = toParticipant(entryB);

  const duel = await prisma.duel.create({
    data: {
      paradoxId: entryA.paradoxId,
      userAId: entryA.userId,
      userBId: entryB.userId,
      startedAt,
      transcriptJson: [],
      kind: opts.kind,
    },
    select: { id: true },
  });

  const state: LiveDuel = {
    duelId: duel.id,
    paradoxId: entryA.paradoxId,
    paradoxTitle: entryA.paradoxTitle,
    paradoxDescription: entryA.paradoxDescription,
    startedAt,
    kind: opts.kind,
    scored: opts.scored,
    timing,
    isPublic:
      opts.kind !== "practice" &&
      userA.schoolCircleIds.length === 0 &&
      userB.schoolCircleIds.length === 0,
    userA,
    userB,
    messages: [],
    acknowledgements: new Map(),
    extensionRequests: new Set(),
    ended: false,
    endedAt: null,
    phaseTimers: [],
    disconnectTimers: new Map(),
    deliveryTimers: new Map(),
    synthesis: { kind: "none" },
    adHominemAwards: new Set(),
    marks: new Map(),
    lastMessageAt: new Map(),
    ai: userB.isBot
      ? { userId: userB.userId, busy: false, pending: false, lastMessageAt: 0, prods: 0 }
      : null,
  };

  duelRegistry.register(state);

  for (const e of [entryA, entryB]) {
    if (!e.socketId) continue;
    const sock = io.sockets.sockets.get(e.socketId);
    if (sock) await sock.join(roomName(duel.id));
  }

  scheduleTimers(io, state);
  await persistState(state);

  for (const p of [userA, userB]) {
    if (p.isBot) continue;
    io.to(userRoom(p.userId)).emit("matchmaking:matched", buildSnapshot(state, p.userId));
  }

  if (state.ai) {
    // The AI opens with a clarifying question after a short beat.
    state.phaseTimers.push(setTimeout(() => void aiTick(io, state), 4000));
  }
}

/**
 * Schedule (or re-schedule, after recovery) the mode transitions and the
 * hard end relative to the duel's own clock.
 */
export function scheduleTimers(io: Io, state: LiveDuel): void {
  const elapsed = Date.now() - state.startedAt.getTime();
  const at = (ms: number) => Math.max(0, ms - elapsed);
  const { timing } = state;
  if (elapsed < timing.clarificationEndMs) {
    state.phaseTimers.push(
      setTimeout(() => onModeChange(io, state, "crucible"), at(timing.clarificationEndMs)),
    );
  }
  if (elapsed < timing.crucibleEndMs) {
    state.phaseTimers.push(
      setTimeout(() => onModeChange(io, state, "bridge"), at(timing.crucibleEndMs)),
    );
  }
  state.phaseTimers.push(
    setTimeout(
      () => void endDuel(io, state, { kind: "timer", message: "The duel has ended." }),
      at(timing.durationMs),
    ),
  );
  if (state.ai) {
    // Nudge the conversation along if the player goes quiet in the Crucible.
    const prod = setInterval(() => {
      if (state.ended || !state.ai) return clearInterval(prod);
      const mode = resolveMode(state.startedAt, new Date(), state.timing).mode;
      if (mode !== "crucible" || state.ai.prods >= 2) return;
      const lastHuman = lastMessageTime(state, state.userA.userId);
      const quietFor = Date.now() - Math.max(lastHuman, state.ai.lastMessageAt);
      if (quietFor > 60_000) {
        state.ai.prods++;
        void aiTick(io, state);
      }
    }, 15_000);
    state.phaseTimers.push(prod as unknown as NodeJS.Timeout);
  }
}

function onModeChange(io: Io, state: LiveDuel, mode: CombatMode): void {
  if (state.ended) return;
  const snap = resolveMode(state.startedAt, new Date(), state.timing);
  io.to(roomName(state.duelId)).emit("duel:phase_change", {
    mode,
    nextTransitionAt: snap.nextTransitionAt,
  });
  if (!state.ai) return;
  if (mode === "crucible") {
    // Open the Crucible with an argument unless the AI spoke very recently.
    if (Date.now() - state.ai.lastMessageAt > 10_000) {
      state.phaseTimers.push(setTimeout(() => void aiTick(io, state), 2500));
    }
  }
  if (mode === "bridge") {
    state.phaseTimers.push(setTimeout(() => void aiAcknowledge(io, state), 6000));
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/* DTOs                                                                     */
/* ──────────────────────────────────────────────────────────────────────── */

export function buildSnapshot(state: LiveDuel, forUserId: string): DuelSnapshotDTO {
  const isA = forUserId === state.userA.userId;
  const you = isA ? state.userA : state.userB;
  const opp = isA ? state.userB : state.userA;
  const snap = resolveMode(state.startedAt, new Date(), state.timing);
  return {
    duelId: state.duelId,
    paradoxId: state.paradoxId,
    paradoxTitle: state.paradoxTitle,
    paradoxDescription: state.paradoxDescription,
    startedAt: state.startedAt.toISOString(),
    duelEndsAt: snap.duelEndsAt,
    nextTransitionAt: state.ended ? null : snap.nextTransitionAt,
    mode: state.ended ? "over" : snap.mode,
    kind: state.kind,
    scored: state.scored,
    timing: state.timing,
    you: {
      userId: you.userId,
      username: you.username,
      tribe: you.tribe,
      choice: you.choice,
      choiceText: you.choiceText,
    },
    opponent: {
      userId: opp.userId,
      username: opp.username,
      tribe: opp.tribe,
      choice: opp.choice,
      choiceText: opp.choiceText,
      isAi: opp.isBot,
    },
    messages: state.messages
      .filter((m) => m.userId === forUserId || m.delivered)
      .map((m) => toMessageDTO(m, forUserId)),
    acknowledgements: Array.from(state.acknowledgements.values()),
    extensionRequests: Array.from(state.extensionRequests),
    endedAt: state.endedAt ? state.endedAt.toISOString() : null,
  };
}

/** The message as `viewerId` is allowed to see it. */
function toMessageDTO(m: DuelMessageEntry, viewerId: string): DuelMessageDTO {
  const hide = m.redacted && m.userId !== viewerId;
  return {
    id: m.id,
    userId: m.userId,
    username: m.username,
    text: hide ? "" : m.text,
    mode: m.mode,
    sentAt: m.sentAt,
    // The opponent sees that it was flagged, not the Oracle's explanation of the insult.
    verdict: hide ? { kind: "fallacy", fallacyType: "ad_hominem", explanation: "" } : m.verdict,
    redacted: m.redacted,
  };
}

function synthesisStateToDTO(s: SynthesisState): SynthesisStateDTO {
  switch (s.kind) {
    case "none":
    case "pending":
    case "declined":
      return s;
    case "ready":
      return { kind: "ready", text: s.text, generatedAt: s.generatedAt.toISOString() };
    case "signed_partial":
      return {
        kind: "signed_partial",
        text: s.text,
        generatedAt: s.generatedAt.toISOString(),
        signedByUserIds: Array.from(s.signedByUserIds),
      };
    case "signed_both":
      return {
        kind: "signed_both",
        text: s.text,
        generatedAt: s.generatedAt.toISOString(),
        signedAt: s.signedAt.toISOString(),
        archiveId: s.archiveId,
      };
  }
}

function broadcastSynthesis(io: Io, state: LiveDuel): void {
  io.to(roomName(state.duelId)).emit("synthesis:update", {
    duelId: state.duelId,
    state: synthesisStateToDTO(state.synthesis),
  });
}

function opponentOf(state: LiveDuel, userId: string): DuelParticipant {
  return userId === state.userA.userId ? state.userB : state.userA;
}

function participant(state: LiveDuel, userId: string): DuelParticipant {
  return userId === state.userA.userId ? state.userA : state.userB;
}

/** Send `entry` to its author (always) and to the opponent once delivered. */
function emitMessage(io: Io, state: LiveDuel, entry: DuelMessageEntry): void {
  io.to(userRoom(entry.userId)).emit("duel:message", toMessageDTO(entry, entry.userId));
  const opp = opponentOf(state, entry.userId);
  if (!opp.isBot && entry.delivered) {
    io.to(userRoom(opp.userId)).emit("duel:message", toMessageDTO(entry, opp.userId));
  }
}

function deliver(io: Io, state: LiveDuel, entry: DuelMessageEntry): void {
  const t = state.deliveryTimers.get(entry.id);
  if (t) {
    clearTimeout(t);
    state.deliveryTimers.delete(entry.id);
  }
  if (entry.delivered) return;
  entry.delivered = true;
  const opp = opponentOf(state, entry.userId);
  if (!opp.isBot) {
    io.to(userRoom(opp.userId)).emit("duel:message", toMessageDTO(entry, opp.userId));
  }
}

function lastMessageTime(state: LiveDuel, userId: string): number {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const m = state.messages[i]!;
    if (m.userId === userId) return new Date(m.sentAt).getTime();
  }
  return state.startedAt.getTime();
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Handlers                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

export function registerDuelHandlers(io: Io, socket: IoSocket): void {
  const existing = duelRegistry.getForUser(socket.data.userId);
  if (existing) {
    void socket.join(roomName(existing.duelId));
    clearDisconnectTimer(existing, socket.data.userId);
    socket.emit("duel:snapshot", buildSnapshot(existing, socket.data.userId));
    if (existing.synthesis.kind !== "none") {
      socket.emit("synthesis:update", {
        duelId: existing.duelId,
        state: synthesisStateToDTO(existing.synthesis),
      });
    }
  }

  socket.on("duel:hello", (duelId) => {
    const state = duelRegistry.get(duelId);
    if (!state) {
      socket.emit("duel:error", { code: "not_found", message: "Duel not found." });
      return;
    }
    if (!isParticipant(state, socket.data.userId)) {
      socket.emit("duel:error", { code: "forbidden", message: "You are not in this duel." });
      return;
    }
    void socket.join(roomName(duelId));
    clearDisconnectTimer(state, socket.data.userId);
    socket.emit("duel:snapshot", buildSnapshot(state, socket.data.userId));
    if (state.synthesis.kind !== "none") {
      socket.emit("synthesis:update", {
        duelId: state.duelId,
        state: synthesisStateToDTO(state.synthesis),
      });
    }
  });

  socket.on("duel:message", ({ duelId, text }) => {
    const state = duelRegistry.get(duelId);
    if (!state || state.ended) {
      socket.emit("duel:error", { code: "not_active", message: "Duel is not active." });
      return;
    }
    if (!isParticipant(state, socket.data.userId)) {
      socket.emit("duel:error", { code: "forbidden", message: "Not your duel." });
      return;
    }
    handleHumanMessage(io, socket, state, typeof text === "string" ? text : "");
  });

  socket.on("duel:acknowledge", ({ duelId, text }) => {
    const state = duelRegistry.get(duelId);
    if (!state || state.ended) {
      socket.emit("duel:error", { code: "not_active", message: "Duel is not active." });
      return;
    }
    if (!isParticipant(state, socket.data.userId)) return;

    const snap = resolveMode(state.startedAt, new Date(), state.timing);
    if (snap.mode !== "bridge") {
      socket.emit("duel:error", {
        code: "wrong_mode",
        message: "Acknowledgements only land during the Bridge Window.",
      });
      return;
    }

    const trimmed = typeof text === "string" ? text.trim() : "";
    if (trimmed.length < 10 || trimmed.length > 300) {
      socket.emit("duel:error", { code: "invalid_ack", message: "Name the point in 10–300 characters." });
      return;
    }
    if (needsStrictFilter(state) && containsProfanity(trimmed)) {
      socket.emit("duel:error", { code: "prohibited_language", message: "Keep it clean — rewrite without profanity." });
      return;
    }
    if (state.acknowledgements.has(socket.data.userId)) {
      socket.emit("duel:error", { code: "already_acked", message: "You have already acknowledged." });
      return;
    }

    recordAck(io, state, socket.data.userId, trimmed);
    // A human ack prompts the AI to answer in kind if it hasn't yet.
    if (state.ai && !state.acknowledgements.has(state.ai.userId)) {
      state.phaseTimers.push(setTimeout(() => void aiAcknowledge(io, state), 2500));
    }
  });

  socket.on("duel:request_extension", ({ duelId }) => {
    const state = duelRegistry.get(duelId);
    if (!state || state.ended) return;
    if (!isParticipant(state, socket.data.userId)) return;

    if (state.acknowledgements.size < 2) {
      socket.emit("duel:error", {
        code: "bridge_incomplete",
        message: "Both must acknowledge before the bridge can be crossed.",
      });
      return;
    }

    state.extensionRequests.add(socket.data.userId);
    // The AI always crosses when invited.
    if (state.ai) state.extensionRequests.add(state.ai.userId);
    const granted = state.extensionRequests.size === 2;
    io.to(roomName(state.duelId)).emit("duel:extension_update", {
      extensionRequests: Array.from(state.extensionRequests),
      granted,
    });
    void persistState(state);

    if (granted) {
      void endDuel(io, state, {
        kind: "extension_granted",
        message: "Both crossed. The Bridge opens.",
      });
    }
  });

  socket.on("synthesis:sign", ({ duelId }) => {
    const state = duelRegistry.get(duelId);
    if (!state) return;
    if (!isParticipant(state, socket.data.userId)) return;
    void signSynthesis(io, state, socket.data.userId);
  });

  socket.on("synthesis:decline", ({ duelId }) => {
    const state = duelRegistry.get(duelId);
    if (!state) return;
    if (!isParticipant(state, socket.data.userId)) return;
    void declineSynthesis(io, state);
  });

  socket.on("duel:report", ({ duelId, reason, note }) => {
    void handleReport(socket, duelId, reason, note);
  });

  socket.on("disconnect", () => {
    if (shuttingDown) return;
    const state = duelRegistry.getForUser(socket.data.userId);
    if (!state || state.ended) return;
    // Another tab for the same player may still be connected.
    const stillHere = Array.from(io.sockets.sockets.values()).some(
      (s) => s.id !== socket.id && s.data.userId === socket.data.userId,
    );
    if (stillHere) return;
    startGhostTimer(io, state, socket.data.userId, socket.data.username, DISCONNECT_GRACE_MS);
  });
}

export function startGhostTimer(
  io: Io,
  state: LiveDuel,
  userId: string,
  username: string,
  graceMs: number,
  /** False after a server restart: a no-show then isn't the player's fault. */
  penalize = true,
): void {
  clearDisconnectTimer(state, userId);
  const timer = setTimeout(() => {
    if (state.ended) return;
    void endDuel(
      io,
      state,
      {
        kind: "ghost",
        message: penalize
          ? `${username} did not return. The duel is void.`
          : `${username} could not reconnect after a server restart. The duel is void — no penalty.`,
      },
      penalize ? userId : undefined,
    );
  }, graceMs);
  state.disconnectTimers.set(userId, timer);
}

function clearDisconnectTimer(state: LiveDuel, userId: string): void {
  const timer = state.disconnectTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    state.disconnectTimers.delete(userId);
  }
}

function isParticipant(state: LiveDuel, userId: string): boolean {
  return userId === state.userA.userId || userId === state.userB.userId;
}

/** School-circle (minor) duels get the profanity filter on top of the Oracle. */
function needsStrictFilter(state: LiveDuel): boolean {
  return state.userA.schoolCircleIds.length > 0 || state.userB.schoolCircleIds.length > 0;
}

function handleHumanMessage(io: Io, socket: IoSocket, state: LiveDuel, text: string): void {
  const userId = socket.data.userId;
  const now = Date.now();
  const last = state.lastMessageAt.get(userId) ?? 0;
  if (now - last < MIN_MESSAGE_GAP_MS) {
    socket.emit("duel:error", { code: "too_fast", message: "Slow down — one thought at a time." });
    return;
  }

  const snap = resolveMode(state.startedAt, new Date(), state.timing);
  const check = isValidMessageForMode(snap.mode, text);
  if (!check.ok) {
    socket.emit("duel:error", { code: "invalid_message", message: check.reason });
    return;
  }
  if (needsStrictFilter(state) && containsProfanity(text)) {
    socket.emit("duel:error", { code: "prohibited_language", message: "Keep it clean — rewrite without profanity." });
    return;
  }
  state.lastMessageAt.set(userId, now);

  const entry: DuelMessageEntry = {
    id: randomUUID(),
    userId,
    username: participant(state, userId).username,
    text: text.trim(),
    mode: snap.mode,
    sentAt: new Date().toISOString(),
    verdict: null,
    redacted: false,
    delivered: false,
  };
  const context = recentContext(state, userId);
  state.messages.push(entry);
  emitMessage(io, state, entry);

  // Hold the opponent's copy until the Oracle has ruled (so ad hominem can
  // be redacted before they ever see it) — but never longer than ORACLE_HOLD_MS.
  state.deliveryTimers.set(
    entry.id,
    setTimeout(() => {
      deliver(io, state, entry);
      void persistState(state);
    }, ORACLE_HOLD_MS),
  );

  analyzeAndPatch(io, state, entry, context)
    .catch((e) => {
      if (process.env.NODE_ENV !== "production") console.warn("[duel] analyze failed", e);
      deliver(io, state, entry);
    })
    .finally(() => {
      void persistState(state);
      // In a spar, the AI answers once it knows what the player really said.
      if (state.ai && !entry.redacted) void aiTick(io, state);
    });
}

function recentContext(state: LiveDuel, authorId: string): ContextMessage[] {
  return state.messages
    .filter((m) => !m.redacted)
    .slice(-4)
    .map((m) => ({ speaker: m.userId === authorId ? "A" : "B", text: m.text }));
}

async function analyzeAndPatch(
  io: Io,
  state: LiveDuel,
  entry: DuelMessageEntry,
  context: ContextMessage[],
): Promise<void> {
  const verdict = await analyzeMessage(entry.text, context, "A");
  // Gold Stars and Red Flags are a Crucible mechanic; outside it we only
  // keep the ad-hominem guard.
  const isAdHominem = verdict.kind === "fallacy" && verdict.fallacyType === "ad_hominem";
  entry.verdict = entry.mode === "crucible" || isAdHominem ? verdict : { kind: "clean" };
  if (isAdHominem) entry.redacted = true;

  deliver(io, state, entry);
  emitMessage(io, state, entry);

  await applyMark(io, state, entry, verdict);
}

function tally(state: LiveDuel, userId: string): MarkTally {
  let t = state.marks.get(userId);
  if (!t) {
    t = { gold: 0, red: 0 };
    state.marks.set(userId, t);
  }
  return t;
}

async function applyMark(io: Io, state: LiveDuel, entry: DuelMessageEntry, verdict: OracleVerdict): Promise<void> {
  const author = participant(state, entry.userId);
  const isAdHominem = verdict.kind === "fallacy" && verdict.fallacyType === "ad_hominem";
  const inCrucible = entry.mode === "crucible";
  if (verdict.kind === "clean" || (!inCrucible && !isAdHominem)) return;

  const t = tally(state, entry.userId);
  const isGold = verdict.kind === "strong_logic";
  if (isGold) t.gold++;
  else t.red++;

  if (state.kind !== "practice") {
    try {
      await prisma.oracleMark.create({
        data: {
          userId: entry.userId,
          duelId: state.duelId,
          paradoxId: state.paradoxId,
          kind: isGold ? "gold_star" : "red_flag",
          fallacyType: verdict.kind === "fallacy" ? verdict.fallacyType : null,
          tribe: author.tribe,
          messageText: entry.text,
          explanation: verdict.explanation,
          // Insults never go public, nor anything from a school-circle duel.
          isPublic: state.isPublic && isGold,
        },
      });
    } catch (e) {
      console.warn("[duel] could not record oracle mark", e);
    }
  }

  if (!state.scored) return;
  const isSpar = state.kind === "spar";

  if (isAdHominem) {
    if (!state.adHominemAwards.has(entry.id)) {
      state.adHominemAwards.add(entry.id);
      await deductCivility(io, entry.userId, PENALTIES.AD_HOMINEM_DETECTED, "AD HOMINEM DETECTED");
    }
    return;
  }
  if (isGold && t.gold <= MAX_SCORED_MARKS_PER_DUEL) {
    await awardWisdomPoints(io, entry.userId, sparScale(AWARDS.GOLD_STAR, isSpar), "GOLD STAR");
  } else if (!isGold && t.red <= MAX_SCORED_MARKS_PER_DUEL) {
    await deductWisdomPoints(io, entry.userId, sparScale(PENALTIES.RED_FLAG_WP, isSpar), "RED FLAG");
  }
}

function recordAck(io: Io, state: LiveDuel, userId: string, text: string): void {
  const ack: AckEntry = {
    userId,
    username: participant(state, userId).username,
    text,
    at: new Date().toISOString(),
  };
  state.acknowledgements.set(userId, ack);
  io.to(roomName(state.duelId)).emit("duel:acknowledge_update", {
    acknowledgements: Array.from(state.acknowledgements.values()),
  });

  // The acknowledger confers WP on the OPPOSITE user (never on the bot).
  const opp = opponentOf(state, userId);
  if (state.scored && !opp.isBot) {
    void awardWisdomPoints(
      io,
      opp.userId,
      sparScale(AWARDS.OPPONENT_ACKNOWLEDGED_YOU, state.kind === "spar"),
      "OPPONENT ACKNOWLEDGED YOUR POINT",
    );
  }
  void persistState(state);
}

/* ──────────────────────────────────────────────────────────────────────── */
/* AI sparring partner                                                      */
/* ──────────────────────────────────────────────────────────────────────── */

function sparContext(state: LiveDuel): SparContext {
  const ai = state.userB;
  const human = state.userA;
  return {
    paradoxTitle: state.paradoxTitle,
    paradoxDescription: state.paradoxDescription,
    aiTribe: ai.tribe,
    aiChoiceText: ai.choiceText,
    playerTribe: human.tribe,
    playerChoiceText: human.choiceText,
    transcript: state.messages
      .filter((m) => !m.redacted)
      .map((m) => ({ fromAi: m.userId === ai.userId, text: m.text, mode: m.mode })),
  };
}

async function aiTick(io: Io, state: LiveDuel): Promise<void> {
  const ai = state.ai;
  if (!ai || state.ended) return;
  if (ai.busy) {
    ai.pending = true;
    return;
  }
  ai.busy = true;
  const began = Date.now();
  try {
    const mode = resolveMode(state.startedAt, new Date(), state.timing).mode;
    if (mode === "over") return;
    const text = await sparReply(sparContext(state), mode);
    // A short, human-feeling pause before the reply lands.
    const wait = Math.max(0, 1800 - (Date.now() - began));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (state.ended) return;
    const nowMode = resolveMode(state.startedAt, new Date(), state.timing).mode;
    if (nowMode === "over") return;
    if (nowMode === "clarification" && !text.trim().endsWith("?")) return;

    const entry: DuelMessageEntry = {
      id: randomUUID(),
      userId: ai.userId,
      username: state.userB.username,
      text,
      mode: nowMode,
      sentAt: new Date().toISOString(),
      verdict: null,
      redacted: false,
      delivered: true,
    };
    state.messages.push(entry);
    ai.lastMessageAt = Date.now();
    io.to(userRoom(state.userA.userId)).emit("duel:message", toMessageDTO(entry, state.userA.userId));
    void persistState(state);
  } catch (e) {
    console.warn("[spar] reply failed", e);
  } finally {
    ai.busy = false;
    if (ai.pending && !state.ended) {
      ai.pending = false;
      setTimeout(() => void aiTick(io, state), 1200);
    }
  }
}

async function aiAcknowledge(io: Io, state: LiveDuel): Promise<void> {
  const ai = state.ai;
  if (!ai || state.ended || state.acknowledgements.has(ai.userId)) return;
  const mode = resolveMode(state.startedAt, new Date(), state.timing).mode;
  if (mode !== "bridge") return;
  const text = await sparAcknowledgement(sparContext(state));
  if (state.ended || state.acknowledgements.has(ai.userId)) return;
  recordAck(io, state, ai.userId, text);
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Persistence                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

/** Checkpoint shape stored in Duel.stateJson (version 1). */
export interface DuelCheckpoint {
  v: 1;
  kind: DuelKind;
  scored: boolean;
  timing: DuelTiming;
  isPublic: boolean;
  paradoxTitle: string;
  paradoxDescription: string;
  userA: DuelParticipant;
  userB: DuelParticipant;
  acknowledgements: AckEntry[];
  extensionRequests: string[];
  adHominemAwards: string[];
  marks: Record<string, MarkTally>;
}

function checkpoint(state: LiveDuel): DuelCheckpoint {
  return {
    v: 1,
    kind: state.kind,
    scored: state.scored,
    timing: state.timing,
    isPublic: state.isPublic,
    paradoxTitle: state.paradoxTitle,
    paradoxDescription: state.paradoxDescription,
    userA: state.userA,
    userB: state.userB,
    acknowledgements: Array.from(state.acknowledgements.values()),
    extensionRequests: Array.from(state.extensionRequests),
    adHominemAwards: Array.from(state.adHominemAwards),
    marks: Object.fromEntries(state.marks),
  };
}

const persistQueue = new Map<string, Promise<void>>();

/** Serialised per duel so writes never land out of order. */
export function persistState(state: LiveDuel): Promise<void> {
  const prev = persistQueue.get(state.duelId) ?? Promise.resolve();
  const next = prev
    .then(() =>
      prisma.duel.update({
        where: { id: state.duelId },
        data: {
          transcriptJson: state.messages as unknown as object,
          stateJson: checkpoint(state) as unknown as object,
        },
      }),
    )
    .then(
      () => undefined,
      (e) => {
        console.warn("[duel] checkpoint failed", e instanceof Error ? e.message : e);
      },
    );
  persistQueue.set(state.duelId, next);
  void next.finally(() => {
    if (persistQueue.get(state.duelId) === next) persistQueue.delete(state.duelId);
  });
  return next;
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Ending, scoring, synthesis                                               */
/* ──────────────────────────────────────────────────────────────────────── */

export async function endDuel(
  io: Io,
  state: LiveDuel,
  reason: EndReason,
  ghosterUserId?: string,
): Promise<void> {
  if (state.ended) return;
  state.ended = true;
  state.endedAt = new Date();
  for (const t of state.phaseTimers) clearTimeout(t);
  state.phaseTimers.length = 0;
  // Anything still held for the Oracle is released into the frozen transcript.
  for (const m of state.messages) if (!m.delivered) deliver(io, state, m);

  await persistState(state);
  try {
    await prisma.duel.update({ where: { id: state.duelId }, data: { endedAt: state.endedAt } });
  } catch {
    /* swallow */
  }

  io.to(roomName(state.duelId)).emit("duel:ended", {
    duelId: state.duelId,
    reason,
    endedAt: state.endedAt.toISOString(),
  });

  await applyEndOfDuelGamification(io, state, reason, ghosterUserId);

  if (reason.kind === "timer" || reason.kind === "extension_granted") {
    state.synthesis = { kind: "pending" };
    broadcastSynthesis(io, state);
    void runSynthesis(io, state);
  }

  setTimeout(() => duelRegistry.unregister(state.duelId), POST_DUEL_RETENTION_MS);
}

async function applyEndOfDuelGamification(
  io: Io,
  state: LiveDuel,
  reason: EndReason,
  ghosterUserId?: string,
): Promise<void> {
  if (!state.scored) return;
  const isSpar = state.kind === "spar";
  const humans = [state.userA, state.userB].filter((p) => !p.isBot);

  // No-fault ghost (couldn't reconnect after a restart): nothing is scored.
  if (reason.kind === "ghost" && !ghosterUserId) return;

  if (reason.kind === "ghost" && ghosterUserId) {
    // Walking out on the AI isn't a civility offence — nobody was left hanging.
    if (isSpar) return;
    await deductCivility(io, ghosterUserId, PENALTIES.GHOSTED_DUEL, "GHOSTED A DUEL");
    const survivor = opponentOf(state, ghosterUserId);
    await awardWisdomPoints(io, survivor.userId, AWARDS.COMPLETED_DUEL, "COMPLETED A DUEL");
    return;
  }

  for (const p of humans) {
    await awardWisdomPoints(io, p.userId, sparScale(AWARDS.COMPLETED_DUEL, isSpar), "COMPLETED A DUEL");

    // Clean conduct: no Red Flags across a real exchange earns a bonus and
    // slowly restores civility.
    const sent = state.messages.filter((m) => m.userId === p.userId).length;
    const red = state.marks.get(p.userId)?.red ?? 0;
    if (sent >= 3 && red === 0) {
      await awardWisdomPoints(io, p.userId, sparScale(AWARDS.CLEAN_DUEL, isSpar), "NO RED FLAGS");
      await restoreCivility(io, p.userId, 2, "CLEAN DUEL");
    }
  }

  // Bridge-window fail (human duels only): -5 civility to anyone who didn't
  // acknowledge. Mutual extension implies both engaged.
  if (reason.kind === "timer" && !isSpar) {
    for (const p of humans) {
      if (!state.acknowledgements.has(p.userId)) {
        await deductCivility(io, p.userId, PENALTIES.FAILED_BRIDGE_WINDOW, "DID NOT CROSS THE BRIDGE");
      }
    }
  }
}

export async function runSynthesis(io: Io, state: LiveDuel): Promise<void> {
  const result = await generateSynthesis({
    paradoxTitle: state.paradoxTitle,
    paradoxDescription: state.paradoxDescription,
    userAId: state.userA.userId,
    userBId: state.userB.userId,
    tribeA: state.userA.tribe,
    tribeB: state.userB.tribe,
    userAChoice: state.userA.choiceText,
    userBChoice: state.userB.choiceText,
    // Redacted insults never shape the bridge.
    messages: state.messages.filter((m) => !m.redacted),
  });

  if (state.synthesis.kind !== "pending") return;

  if (result.kind === "no_synthesis") {
    state.synthesis = { kind: "declined", reason: "The Oracle could not bridge this exchange." };
    broadcastSynthesis(io, state);
    return;
  }

  const now = new Date();
  state.synthesis = { kind: "ready", text: result.text, generatedAt: now };
  try {
    await prisma.duel.update({
      where: { id: state.duelId },
      data: { synthesisText: result.text, synthesisGeneratedAt: now },
    });
  } catch {
    /* swallow */
  }
  broadcastSynthesis(io, state);
}

async function signSynthesis(io: Io, state: LiveDuel, userId: string): Promise<void> {
  const s = state.synthesis;
  if (s.kind !== "ready" && s.kind !== "signed_partial") return;

  const text = s.text;
  const generatedAt = s.generatedAt;
  const signers = s.kind === "signed_partial" ? new Set(s.signedByUserIds) : new Set<string>();
  signers.add(userId);
  // The AI co-signs whatever the player signs.
  if (state.ai) signers.add(state.ai.userId);

  try {
    const now = new Date();
    await prisma.duel.update({
      where: { id: state.duelId },
      data: {
        ...(signers.has(state.userA.userId) ? { signedByAAt: now } : {}),
        ...(signers.has(state.userB.userId) ? { signedByBAt: now } : {}),
      },
    });
  } catch {
    /* swallow */
  }

  if (signers.size < 2) {
    state.synthesis = { kind: "signed_partial", text, generatedAt, signedByUserIds: signers };
    broadcastSynthesis(io, state);
    return;
  }

  const signedAt = new Date();
  // Only human-vs-human syntheses enter the Global Archive — it is the record
  // of two people with opposing views agreeing on something.
  if (state.kind === "pvp") {
    try {
      const archive = await prisma.synthesisArchive.create({
        data: {
          duelId: state.duelId,
          paradoxTitle: state.paradoxTitle,
          tribeA: state.userA.tribe,
          tribeB: state.userB.tribe,
          synthesisText: text,
          signedAt,
        },
        select: { id: true },
      });
      await prisma.duel.update({ where: { id: state.duelId }, data: { bothSigned: true } });
      state.synthesis = { kind: "signed_both", text, generatedAt, signedAt, archiveId: archive.id };
    } catch {
      state.synthesis = { kind: "signed_both", text, generatedAt, signedAt, archiveId: "pending" };
    }
  } else {
    try {
      await prisma.duel.update({ where: { id: state.duelId }, data: { bothSigned: true } });
    } catch {
      /* swallow */
    }
    state.synthesis = { kind: "signed_both", text, generatedAt, signedAt, archiveId: state.kind };
  }
  broadcastSynthesis(io, state);

  if (!state.scored) return;
  for (const p of [state.userA, state.userB]) {
    if (p.isBot) continue;
    await awardWisdomPoints(
      io,
      p.userId,
      sparScale(AWARDS.BOTH_SIGNED_SYNTHESIS, state.kind === "spar"),
      "BOTH SIGNED THE SYNTHESIS",
    );
  }
}

async function declineSynthesis(io: Io, state: LiveDuel): Promise<void> {
  const s = state.synthesis;
  if (s.kind !== "ready" && s.kind !== "signed_partial") return;
  state.synthesis = { kind: "declined", reason: "One side refused to sign. The bridge collapsed." };
  try {
    await prisma.duel.update({ where: { id: state.duelId }, data: { declinedAt: new Date() } });
  } catch {
    /* swallow */
  }
  broadcastSynthesis(io, state);
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Reports                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

const REPORT_REASONS = new Set(["harassment", "hate", "sexual", "spam", "other"]);

async function handleReport(socket: IoSocket, duelId: string, reason: string, note?: string): Promise<void> {
  const reporterId = socket.data.userId;
  if (!REPORT_REASONS.has(reason)) {
    socket.emit("duel:error", { code: "bad_report", message: "Pick a reason for the report." });
    return;
  }
  const duel = await prisma.duel.findUnique({
    where: { id: duelId },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!duel || (duel.userAId !== reporterId && duel.userBId !== reporterId)) {
    socket.emit("duel:error", { code: "forbidden", message: "You can only report your own duels." });
    return;
  }
  // Reports against the AI partner are kept too — they flag bad model output.
  const reportedId = duel.userAId === reporterId ? duel.userBId : duel.userAId;
  const already = await prisma.duelReport.findFirst({
    where: { duelId, reporterId },
    select: { id: true },
  });
  if (!already) {
    await prisma.duelReport.create({
      data: {
        duelId,
        reporterId,
        reportedId,
        reason,
        note: typeof note === "string" ? note.slice(0, 500) : null,
      },
    });
  }
  socket.emit("duel:notice", {
    code: "reported",
    message: "Report received. A moderator will review this duel's transcript.",
  });
}
