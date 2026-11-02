import { prisma } from "../db.js";
import { TRIBES, type TribeName } from "./oracle.js";

export interface ParadoxResults {
  totalVotes: number;
  choiceCounts: { A: number; B: number };
  tribeCounts: Record<TribeName, number>;
  /** How each tribe split between A and B. */
  tribeChoice: Record<TribeName, { A: number; B: number }>;
}

/**
 * Aggregate results for one paradox. Bot accounts never vote, but the
 * filter is explicit so a future change can't skew the public numbers.
 */
export async function paradoxResults(paradoxId: string): Promise<ParadoxResults> {
  const rows = await prisma.vote.groupBy({
    by: ["choice", "tribeAssigned"],
    where: { paradoxId, user: { isBot: false } },
    _count: { _all: true },
  });

  const choiceCounts = { A: 0, B: 0 };
  const tribeCounts = Object.fromEntries(TRIBES.map((t) => [t, 0])) as Record<TribeName, number>;
  const tribeChoice = Object.fromEntries(TRIBES.map((t) => [t, { A: 0, B: 0 }])) as Record<
    TribeName,
    { A: number; B: number }
  >;

  for (const row of rows) {
    const n = row._count._all;
    choiceCounts[row.choice] += n;
    if (row.tribeAssigned) {
      const t = row.tribeAssigned as TribeName;
      tribeCounts[t] += n;
      tribeChoice[t][row.choice] += n;
    }
  }

  return {
    totalVotes: choiceCounts.A + choiceCounts.B,
    choiceCounts,
    tribeCounts,
    tribeChoice,
  };
}

/**
 * The paradox's sequence number ("PARADOX #142") — its position among all
 * scheduled paradoxes by air date. Used on share cards and public pages.
 */
export async function paradoxNumber(airDate: Date | null): Promise<number | null> {
  if (!airDate) return null;
  return prisma.paradox.count({ where: { airDate: { lte: airDate } } });
}
