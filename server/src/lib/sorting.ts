import { prisma } from "../db.js";
import { parseYmd } from "../phases.js";
import { sortIntoTribe, type TribeName } from "./oracle.js";

/**
 * Tribe sorting, shared by the /sort route (on-demand), the background
 * batch job (everyone, right after the Vow closes) and late vows (sorted
 * the moment they're cast).
 *
 * An in-flight map de-duplicates concurrent requests for the same vote, so
 * a player opening the Sort page while the batch job is mid-way through
 * their vote never triggers a second Oracle call.
 */

export interface SortedVote {
  tribe: TribeName;
  confidence: number;
  reasoning: string;
}

const inFlight = new Map<string, Promise<SortedVote>>();

export function sortVote(voteId: string): Promise<SortedVote> {
  const existing = inFlight.get(voteId);
  if (existing) return existing;
  const p = doSort(voteId).finally(() => inFlight.delete(voteId));
  inFlight.set(voteId, p);
  return p;
}

async function doSort(voteId: string): Promise<SortedVote> {
  const vote = await prisma.vote.findUniqueOrThrow({
    where: { id: voteId },
    include: {
      paradox: {
        select: { id: true, title: true, description: true, optionA: true, optionB: true, airDate: true },
      },
    },
  });

  if (vote.tribeAssigned && vote.tribeConfidence !== null && vote.tribeReasoning) {
    return {
      tribe: vote.tribeAssigned as TribeName,
      confidence: vote.tribeConfidence,
      reasoning: vote.tribeReasoning,
    };
  }

  const { paradox } = vote;
  const result = await sortIntoTribe({
    paradoxTitle: paradox.title,
    paradoxDescription: paradox.description,
    choiceText: vote.choice === "A" ? paradox.optionA : paradox.optionB,
    justification: vote.justification,
  });

  await prisma.$transaction([
    prisma.vote.update({
      where: { id: vote.id },
      data: {
        tribeAssigned: result.tribe,
        tribeConfidence: result.confidence,
        tribeReasoning: result.reasoning,
        sortedAt: new Date(),
      },
    }),
    // Unscheduled paradoxes (the first-run practice dilemma) don't feed the
    // tribe timeline / Moral Constellation.
    ...(paradox.airDate
      ? [
          prisma.tribeHistory.upsert({
            where: { userId_paradoxId: { userId: vote.userId, paradoxId: paradox.id } },
            create: {
              userId: vote.userId,
              paradoxId: paradox.id,
              tribe: result.tribe,
              airDate: paradox.airDate,
            },
            update: { tribe: result.tribe },
          }),
        ]
      : []),
  ]);

  return result;
}

let batchRunning = false;

/**
 * Sort every unsorted vow for `today`'s paradox. Bounded concurrency keeps
 * us well under Oracle rate limits; anything that fails is retried on the
 * next scheduler tick (and on demand when the player opens the Sort page).
 */
export async function sortPendingVotes(today: string, concurrency = 4, limit = 200): Promise<number> {
  if (batchRunning) return 0;
  batchRunning = true;
  try {
    const paradox = await prisma.paradox.findUnique({
      where: { airDate: parseYmd(today) },
      select: { id: true },
    });
    if (!paradox) return 0;

    const pending = await prisma.vote.findMany({
      where: { paradoxId: paradox.id, tribeAssigned: null },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true },
    });
    if (pending.length === 0) return 0;

    let done = 0;
    let idx = 0;
    const worker = async () => {
      while (idx < pending.length) {
        const v = pending[idx++]!;
        try {
          await sortVote(v.id);
          done++;
        } catch (e) {
          console.warn("[sort] batch sort failed for vote", v.id, e instanceof Error ? e.message : e);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
    console.log(`[sort] batch sorted ${done}/${pending.length} vows for ${today}`);
    return done;
  } finally {
    batchRunning = false;
  }
}
