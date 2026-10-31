import type { Server } from "socket.io";
import { prisma } from "../db.js";
import { resolveMode } from "../lib/duelPhases.js";
import {
  RECOVERY_GRACE_MS,
  endDuel,
  scheduleTimers,
  startGhostTimer,
  type DuelCheckpoint,
} from "./duel.js";
import { duelRegistry, type DuelMessageEntry, type LiveDuel } from "./duelRegistry.js";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./types.js";

type Io = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** Ended duels this recent can still collect Synthesis signatures. */
const SIGNING_WINDOW_MS = 10 * 60 * 1000;

function isCheckpoint(v: unknown): v is DuelCheckpoint {
  return typeof v === "object" && v !== null && (v as { v?: unknown }).v === 1;
}

function fromRow(row: {
  id: string;
  paradoxId: string;
  startedAt: Date;
  endedAt: Date | null;
  transcriptJson: unknown;
  stateJson: unknown;
}): LiveDuel | null {
  if (!isCheckpoint(row.stateJson)) return null;
  const cp = row.stateJson;
  const messages = (Array.isArray(row.transcriptJson) ? row.transcriptJson : []) as DuelMessageEntry[];
  return {
    duelId: row.id,
    paradoxId: row.paradoxId,
    paradoxTitle: cp.paradoxTitle,
    paradoxDescription: cp.paradoxDescription,
    startedAt: row.startedAt,
    kind: cp.kind,
    scored: cp.scored,
    timing: cp.timing,
    isPublic: cp.isPublic,
    userA: cp.userA,
    userB: cp.userB,
    // Everything in the checkpoint was already visible or past its hold.
    messages: messages.map((m) => ({ ...m, delivered: true, redacted: Boolean(m.redacted) })),
    acknowledgements: new Map(cp.acknowledgements.map((a) => [a.userId, a])),
    extensionRequests: new Set(cp.extensionRequests),
    ended: row.endedAt !== null,
    endedAt: row.endedAt,
    phaseTimers: [],
    disconnectTimers: new Map(),
    deliveryTimers: new Map(),
    synthesis: { kind: "none" },
    adHominemAwards: new Set(cp.adHominemAwards),
    marks: new Map(Object.entries(cp.marks)),
    lastMessageAt: new Map(),
    ai: cp.userB.isBot
      ? { userId: cp.userB.userId, busy: false, pending: false, lastMessageAt: Date.now(), prods: 0 }
      : null,
  };
}

/**
 * Rebuild in-flight duels from their checkpoints after a restart or deploy.
 * Must run before the HTTP server starts accepting sockets, so reconnecting
 * players land straight back in their duel.
 *
 *  - Still running: re-register, re-arm mode timers on the original clock,
 *    and give each human RECOVERY_GRACE_MS to reconnect before it's a ghost.
 *  - Past its end time: close it out normally (scoring + Synthesis).
 *  - Ended recently with an unsigned Synthesis: restore it so the players
 *    can still sign.
 *  - Legacy rows with no checkpoint: just mark ended.
 */
export async function recoverDuels(io: Io): Promise<void> {
  const now = new Date();
  const open = await prisma.duel.findMany({
    where: { endedAt: null },
    select: {
      id: true,
      paradoxId: true,
      startedAt: true,
      endedAt: true,
      transcriptJson: true,
      stateJson: true,
    },
  });

  let resumed = 0;
  let closed = 0;
  for (const row of open) {
    const state = fromRow(row);
    if (!state) {
      await prisma.duel.update({ where: { id: row.id }, data: { endedAt: now } });
      closed++;
      continue;
    }
    // Ancient stragglers (e.g. a crash days ago) aren't worth scoring.
    if (now.getTime() - row.startedAt.getTime() > 6 * 60 * 60 * 1000) {
      await prisma.duel.update({ where: { id: row.id }, data: { endedAt: now } });
      closed++;
      continue;
    }

    duelRegistry.register(state);
    const mode = resolveMode(state.startedAt, now, state.timing).mode;
    if (mode === "over") {
      await endDuel(io, state, { kind: "timer", message: "The duel has ended." });
      closed++;
      continue;
    }
    scheduleTimers(io, state);
    for (const p of [state.userA, state.userB]) {
      if (!p.isBot) startGhostTimer(io, state, p.userId, p.username, RECOVERY_GRACE_MS);
    }
    resumed++;
  }

  const signable = await prisma.duel.findMany({
    where: {
      endedAt: { gte: new Date(now.getTime() - SIGNING_WINDOW_MS) },
      synthesisText: { not: null },
      synthesisGeneratedAt: { not: null },
      bothSigned: false,
      declinedAt: null,
    },
    select: {
      id: true,
      paradoxId: true,
      startedAt: true,
      endedAt: true,
      transcriptJson: true,
      stateJson: true,
      synthesisText: true,
      synthesisGeneratedAt: true,
      signedByAAt: true,
      signedByBAt: true,
    },
  });
  let restored = 0;
  for (const row of signable) {
    if (duelRegistry.get(row.id)) continue;
    const state = fromRow(row);
    if (!state) continue;
    const signers = new Set<string>();
    if (row.signedByAAt) signers.add(state.userA.userId);
    if (row.signedByBAt) signers.add(state.userB.userId);
    state.synthesis =
      signers.size > 0
        ? {
            kind: "signed_partial",
            text: row.synthesisText!,
            generatedAt: row.synthesisGeneratedAt!,
            signedByUserIds: signers,
          }
        : { kind: "ready", text: row.synthesisText!, generatedAt: row.synthesisGeneratedAt! };
    duelRegistry.register(state);
    const remaining = SIGNING_WINDOW_MS - (now.getTime() - row.endedAt!.getTime());
    setTimeout(() => duelRegistry.unregister(state.duelId), Math.max(0, remaining));
    restored++;
  }

  if (resumed || closed || restored) {
    console.log(`[duel] recovery: resumed=${resumed} closed=${closed} signable=${restored}`);
  }
}
