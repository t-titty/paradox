import { prisma } from "../db.js";
import { parseYmd } from "../phases.js";

/**
 * Throwback Thursday: on Thursdays, surface a user's oldest eligible prior
 * Thursday vote — a paradox they voted on at least 28 days ago, on a Thursday
 * — so they can revote and see if their mind has changed.
 *
 * Eligibility:
 *   - today is a Thursday
 *   - user has at least one Vote where paradox.airDate was a Thursday
 *   - that airDate is ≥ 28 days before today
 *   - no ThrowbackRevote already exists for that vote
 *
 * Returns the oldest eligible vote + its paradox, or null if none.
 */
export async function findThrowbackVote(userId: string, today: string) {
  const todayDate = parseYmd(today);
  if (todayDate.getDay() !== 4) return null; // 0=Sun..4=Thu

  const cutoff = new Date(todayDate);
  cutoff.setDate(cutoff.getDate() - 28);

  // Grab the user's oldest votes, then filter: paradox aired on a Thursday,
  // old enough, and not yet revisited.
  const votes = await prisma.vote.findMany({
    where: {
      userId,
      paradox: { airDate: { lte: cutoff } },
      throwbackRevote: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      paradox: {
        select: {
          id: true,
          title: true,
          description: true,
          optionA: true,
          optionB: true,
          category: true,
          airDate: true,
          submittedBy: { select: { username: true } },
        },
      },
    },
  });

  for (const vote of votes) {
    if (vote.paradox.airDate && vote.paradox.airDate.getDay() === 4) {
      return vote;
    }
  }
  return null;
}

/**
 * Classify whether a revote represents a shift, a held line, or an evolution.
 *   - shifted: choice flipped
 *   - held:    same choice, justification substantially the same (Jaccard ≥ 0.6)
 *   - evolved: same choice, justification meaningfully different
 */
export type Shift = "shifted" | "held" | "evolved";

export function classifyShift(
  originalChoice: "A" | "B",
  originalJustification: string,
  newChoice: "A" | "B",
  newJustification: string,
): Shift {
  if (originalChoice !== newChoice) return "shifted";
  const sim = jaccard(tokenize(originalJustification), tokenize(newJustification));
  return sim >= 0.6 ? "held" : "evolved";
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
