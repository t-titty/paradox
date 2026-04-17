import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { prisma } from "../db.js";
import {
  CLARIFICATION_END_MS,
  CRUCIBLE_END_MS,
  DUEL_DURATION_MS,
  isValidMessageForMode,
  resolveMode,
  type CombatMode,
} from "../lib/duelPhases.js";
import { analyzeMessage } from "../lib/fallacy.js";
import { generateSynthesis } from "../lib/synthesis.js";
import {
  AWARDS,
  PENALTIES,
  awardWisdomPoints,
  deductCivility,
} from "../lib/gamification.js";
import {
  duelRegistry,
  type AckEntry,
  type DuelMessageEntry,
  type LiveDuel,
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

export function roomName(duelId: string): string {
  return `duel:${duelId}`;
}

export async function startDuel(
  io: Io,
  entryA: {
    userId: string;
    username: string;
    socketId: string;
    tribe: import("../lib/oracle.js").TribeName;
    choice: import("@prisma/client").Choice;
    choiceText: string;
    paradoxId: string;
    paradoxTitle: string;
    paradoxDescription: string;
  },
  entryB: typeof entryA,
): Promise<void> {
  const startedAt = new Date();
  const duel = await prisma.duel.create({
    data: {
      paradoxId: entryA.paradoxId,
      userAId: entryA.userId,
      userBId: entryB.userId,
      startedAt,
      transcriptJson: [],
    },
    select: { id: true },
  });

  const state: LiveDuel = {
    duelId: duel.id,
    paradoxId: entryA.paradoxId,
    paradoxTitle: entryA.paradoxTitle,
    paradoxDescription: entryA.paradoxDescription,
    startedAt,
    userA: {
      userId: entryA.userId,
      username: entryA.username,
      tribe: entryA.tribe,
      choice: entryA.choice,
      choiceText: entryA.choiceText,
    },
    userB: {
      userId: entryB.userId,
      username: entryB.username,
      tribe: entryB.tribe,
      choice: entryB.choice,
      choiceText: entryB.choiceText,
    },
    messages: [],
    acknowledgements: new Map(),
    extensionRequests: new Set(),
    ended: false,
    endedAt: null,
    phaseTimers: [],
    disconnectTimers: new Map(),
    synthesis: { kind: "none" },
    adHominemAwards: new Set(),
  };

  duelRegistry.register(state);

  const sockA = io.sockets.sockets.get(entryA.socketId);
  const sockB = io.sockets.sockets.get(entryB.socketId);
  if (sockA) await sockA.join(roomName(duel.id));
  if (sockB) await sockB.join(roomName(duel.id));

  state.phaseTimers.push(
    setTimeout(() => emitPhaseChange(io, state, "crucible"), CLARIFICATION_END_MS),
    setTimeout(() => emitPhaseChange(io, state, "bridge"), CRUCIBLE_END_MS),
    setTimeout(
      () => void endDuel(io, state, { kind: "timer", message: "The duel has ended." }),
      DUEL_DURATION_MS,
    ),
  );

  if (sockA) sockA.emit("matchmaking:matched", buildSnapshot(state, entryA.userId));
  if (sockB) sockB.emit("matchmaking:matched", buildSnapshot(state, entryB.userId));
}

function emitPhaseChange(io: Io, state: LiveDuel, mode: CombatMode): void {
  if (state.ended) return;
  const snap = resolveMode(state.startedAt);
  io.to(roomName(state.duelId)).emit("duel:phase_change", {
    mode,
    nextTransitionAt: snap.nextTransitionAt,
  });
}

function buildSnapshot(state: LiveDuel, forUserId: string): DuelSnapshotDTO {
  const isA = forUserId === state.userA.userId;
  const you = isA ? state.userA : state.userB;
  const opp = isA ? state.userB : state.userA;
  const snap = resolveMode(state.startedAt);
  return {
    duelId: state.duelId,
    paradoxId: state.paradoxId,
    paradoxTitle: state.paradoxTitle,
    paradoxDescription: state.paradoxDescription,
    startedAt: state.startedAt.toISOString(),
    duelEndsAt: snap.duelEndsAt,
    nextTransitionAt: snap.nextTransitionAt,
    mode: snap.mode,
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
    },
    messages: state.messages.map(toMessageDTO),
    acknowledgements: Array.from(state.acknowledgements.values()),
    extensionRequests: Array.from(state.extensionRequests),
    endedAt: state.endedAt ? state.endedAt.toISOString() : null,
  };
}

function toMessageDTO(m: DuelMessageEntry): DuelMessageDTO {
  return {
    id: m.id,
    userId: m.userId,
    username: m.username,
    text: m.text,
    mode: m.mode,
    sentAt: m.sentAt,
    verdict: m.verdict,
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

/* ──────────────────────────────────────────────────────────────────────── */
/* Handlers                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

export function registerDuelHandlers(io: Io, socket: IoSocket): void {
  const existing = duelRegistry.getForUser(socket.data.userId);
  if (existing) {
    void socket.join(roomName(existing.duelId));
    clearDisconnectTimer(existing, socket.data.userId);
    socket.emit("duel:snapshot", buildSnapshot(existing, socket.data.userId));
    // Replay current synthesis state on reconnect.
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

    const snap = resolveMode(state.startedAt);
    const check = isValidMessageForMode(snap.mode, text);
    if (!check.ok) {
      socket.emit("duel:error", { code: "invalid_message", message: check.reason });
      return;
    }

    const username =
      socket.data.userId === state.userA.userId ? state.userA.username : state.userB.username;

    const entry: DuelMessageEntry = {
      id: randomUUID(),
      userId: socket.data.userId,
      username,
      text: text.trim(),
      mode: snap.mode,
      sentAt: new Date().toISOString(),
      verdict: null,
    };
    state.messages.push(entry);
    io.to(roomName(state.duelId)).emit("duel:message", toMessageDTO(entry));

    if (snap.mode === "crucible") {
      analyzeAndPatch(io, state, entry).catch((e) => {
        if (process.env.NODE_ENV !== "production") console.warn("[duel] analyze failed", e);
      });
    } else {
      persistTranscript(state).catch(() => {});
    }
  });

  socket.on("duel:acknowledge", ({ duelId, text }) => {
    const state = duelRegistry.get(duelId);
    if (!state || state.ended) {
      socket.emit("duel:error", { code: "not_active", message: "Duel is not active." });
      return;
    }
    if (!isParticipant(state, socket.data.userId)) return;

    const snap = resolveMode(state.startedAt);
    if (snap.mode !== "bridge") {
      socket.emit("duel:error", {
        code: "wrong_mode",
        message: "Acknowledgements only land during the Bridge Window.",
      });
      return;
    }

    const trimmed = text.trim();
    if (trimmed.length < 10 || trimmed.length > 300) {
      socket.emit("duel:error", {
        code: "invalid_ack",
        message: "Name the point in 10–300 characters.",
      });
      return;
    }
    if (state.acknowledgements.has(socket.data.userId)) {
      socket.emit("duel:error", { code: "already_acked", message: "You have already acknowledged." });
      return;
    }

    const username =
      socket.data.userId === state.userA.userId ? state.userA.username : state.userB.username;

    const ack: AckEntry = {
      userId: socket.data.userId,
      username,
      text: trimmed,
      at: new Date().toISOString(),
    };
    state.acknowledgements.set(socket.data.userId, ack);

    io.to(roomName(state.duelId)).emit("duel:acknowledge_update", {
      acknowledgements: Array.from(state.acknowledgements.values()),
    });

    // Spec: "+10 WP: Opponent clicks 'Acknowledge' on your point"
    // The acknowledger confers +10 on the OPPOSITE user.
    const opponentId =
      socket.data.userId === state.userA.userId ? state.userB.userId : state.userA.userId;
    void awardWisdomPoints(io, opponentId, AWARDS.OPPONENT_ACKNOWLEDGED_YOU, "OPPONENT ACKNOWLEDGED YOUR POINT");

    persistTranscript(state).catch(() => {});
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
    const granted = state.extensionRequests.size === 2;
    io.to(roomName(state.duelId)).emit("duel:extension_update", {
      extensionRequests: Array.from(state.extensionRequests),
      granted,
    });

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
    void declineSynthesis(io, state, socket.data.userId);
  });

  socket.on("disconnect", () => {
    const state = duelRegistry.getForUser(socket.data.userId);
    if (!state || state.ended) return;

    const ghosterUserId = socket.data.userId;
    const ghosterUsername = socket.data.username;
    const timer = setTimeout(() => {
      if (state.ended) return;
      void endDuel(
        io,
        state,
        { kind: "ghost", message: `${ghosterUsername} did not return. The duel is void.` },
        ghosterUserId,
      );
    }, DISCONNECT_GRACE_MS);
    state.disconnectTimers.set(ghosterUserId, timer);
  });
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

async function analyzeAndPatch(io: Io, state: LiveDuel, entry: DuelMessageEntry): Promise<void> {
  const verdict = await analyzeMessage(entry.text);
  entry.verdict = verdict;
  io.to(roomName(state.duelId)).emit("duel:message", toMessageDTO(entry));

  // Ad hominem → -10 civility on the offender. Only once per message; the
  // adHominemAwards set guards against double-application on reconnect replays.
  if (verdict.kind === "fallacy" && verdict.fallacyType === "ad_hominem") {
    if (!state.adHominemAwards.has(entry.id)) {
      state.adHominemAwards.add(entry.id);
      void deductCivility(io, entry.userId, PENALTIES.AD_HOMINEM_DETECTED, "AD HOMINEM DETECTED");
    }
  }

  await persistTranscript(state);
}

async function persistTranscript(state: LiveDuel): Promise<void> {
  try {
    await prisma.duel.update({
      where: { id: state.duelId },
      data: { transcriptJson: state.messages as unknown as object },
    });
  } catch {
    /* swallow */
  }
}

async function endDuel(
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

  try {
    await prisma.duel.update({
      where: { id: state.duelId },
      data: {
        transcriptJson: state.messages as unknown as object,
        endedAt: state.endedAt,
      },
    });
  } catch {
    /* swallow */
  }

  io.to(roomName(state.duelId)).emit("duel:ended", {
    duelId: state.duelId,
    reason,
    endedAt: state.endedAt.toISOString(),
  });

  // ---- Gamification hooks ----
  await applyEndOfDuelGamification(io, state, reason, ghosterUserId);

  // ---- Synthesis generation (only on clean ends) ----
  if (reason.kind === "timer" || reason.kind === "extension_granted") {
    state.synthesis = { kind: "pending" };
    broadcastSynthesis(io, state);
    void runSynthesis(io, state);
  }

  // Keep state around for 10 minutes so sign/decline has time to land.
  setTimeout(() => duelRegistry.unregister(state.duelId), 10 * 60 * 1000);
}

async function applyEndOfDuelGamification(
  io: Io,
  state: LiveDuel,
  reason: EndReason,
  ghosterUserId?: string,
): Promise<void> {
  // Ghost: the disconnector loses 20 civility, the other gets +5 completion
  // (they showed up and finished their end).
  if (reason.kind === "ghost" && ghosterUserId) {
    await deductCivility(io, ghosterUserId, PENALTIES.GHOSTED_DUEL, "GHOSTED A DUEL");
    const survivor =
      ghosterUserId === state.userA.userId ? state.userB.userId : state.userA.userId;
    await awardWisdomPoints(io, survivor, AWARDS.COMPLETED_DUEL, "COMPLETED A DUEL");
    return;
  }

  // Clean ends: both users get +5 completion.
  for (const uid of [state.userA.userId, state.userB.userId]) {
    await awardWisdomPoints(io, uid, AWARDS.COMPLETED_DUEL, "COMPLETED A DUEL");
  }

  // Bridge-window fail: -5 civility to anyone who didn't acknowledge. Only
  // applies on timer end (not extension_granted — mutual extension implies
  // both were engaged enough that no failure occurred).
  if (reason.kind === "timer") {
    for (const uid of [state.userA.userId, state.userB.userId]) {
      if (!state.acknowledgements.has(uid)) {
        await deductCivility(io, uid, PENALTIES.FAILED_BRIDGE_WINDOW, "DID NOT CROSS THE BRIDGE");
      }
    }
  }
}

async function runSynthesis(io: Io, state: LiveDuel): Promise<void> {
  const result = await generateSynthesis({
    paradoxTitle: state.paradoxTitle,
    paradoxDescription: state.paradoxDescription,
    userAId: state.userA.userId,
    userBId: state.userB.userId,
    tribeA: state.userA.tribe,
    tribeB: state.userB.tribe,
    userAChoice: state.userA.choiceText,
    userBChoice: state.userB.choiceText,
    messages: state.messages,
  });

  if (state.synthesis.kind !== "pending") return; // something overrode (rare)

  if (result.kind === "no_synthesis") {
    state.synthesis = {
      kind: "declined",
      reason: "The Oracle could not bridge this exchange.",
    };
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
  if (s.kind !== "ready" && s.kind !== "signed_partial") {
    return;
  }

  const text = s.text;
  const generatedAt = s.generatedAt;
  const signers = s.kind === "signed_partial" ? new Set(s.signedByUserIds) : new Set<string>();
  signers.add(userId);

  // Update per-user DB flags.
  const isA = userId === state.userA.userId;
  try {
    await prisma.duel.update({
      where: { id: state.duelId },
      data: isA ? { signedByAAt: new Date() } : { signedByBAt: new Date() },
    });
  } catch {
    /* swallow */
  }

  if (signers.size < 2) {
    state.synthesis = {
      kind: "signed_partial",
      text,
      generatedAt,
      signedByUserIds: signers,
    };
    broadcastSynthesis(io, state);
    return;
  }

  // Both signed — persist to archive + award WP.
  const signedAt = new Date();
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
    await prisma.duel.update({
      where: { id: state.duelId },
      data: { bothSigned: true },
    });
    state.synthesis = {
      kind: "signed_both",
      text,
      generatedAt,
      signedAt,
      archiveId: archive.id,
    };
  } catch {
    // If archive write fails, still mark as signed_both in memory so the UI
    // doesn't get stuck. Ops can replay later.
    state.synthesis = {
      kind: "signed_both",
      text,
      generatedAt,
      signedAt,
      archiveId: "pending",
    };
  }
  broadcastSynthesis(io, state);

  await awardWisdomPoints(io, state.userA.userId, AWARDS.BOTH_SIGNED_SYNTHESIS, "BOTH SIGNED THE SYNTHESIS");
  await awardWisdomPoints(io, state.userB.userId, AWARDS.BOTH_SIGNED_SYNTHESIS, "BOTH SIGNED THE SYNTHESIS");
}

async function declineSynthesis(io: Io, state: LiveDuel, userId: string): Promise<void> {
  const s = state.synthesis;
  if (s.kind !== "ready" && s.kind !== "signed_partial") return;

  state.synthesis = {
    kind: "declined",
    reason: `One side refused to sign. The bridge collapsed.`,
  };
  try {
    await prisma.duel.update({
      where: { id: state.duelId },
      data: { declinedAt: new Date() },
    });
  } catch {
    /* swallow */
  }
  broadcastSynthesis(io, state);
  // Touch userId to satisfy unused lint — decliner identity is already in the
  // transcript if audit is needed later.
  void userId;
}
