import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { parseYmd } from "../phases.js";

/**
 * Paradox calendar upkeep.
 *
 * The seed only ever *adds* paradoxes (it never reschedules or rewrites
 * ones already on the calendar), so the calendar can run out. When a day
 * has no paradox we fill it — first from the unscheduled pool (new seed
 * content, approved submissions), then by re-airing the paradox that aired
 * longest ago. A day is never left empty.
 */

export const PRACTICE_CATEGORY = "Practice";

export const PRACTICE_PARADOX = {
  title: "The Lifeboat",
  description:
    "A lifeboat built for eight holds nine. A storm is coming. If no one leaves, the boat will likely sink and all nine may drown. The strongest swimmer could go overboard and probably die — or the group could draw lots.",
  optionA: "Draw lots. Everyone faces the same odds",
  optionB: "Ask the strongest swimmer to go. Their odds are best",
  category: PRACTICE_CATEGORY,
} as const;

export async function ensureParadoxForDate(ymdStr: string): Promise<{ id: string } | null> {
  const airDate = parseYmd(ymdStr);
  const existing = await prisma.paradox.findUnique({ where: { airDate }, select: { id: true } });
  if (existing) return existing;

  try {
    const unscheduled = await prisma.paradox.findFirst({
      where: { airDate: null, category: { not: PRACTICE_CATEGORY } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (unscheduled) {
      return await prisma.paradox.update({
        where: { id: unscheduled.id },
        data: { airDate },
        select: { id: true },
      });
    }

    const oldest = await prisma.paradox.findFirst({
      where: { airDate: { not: null, lt: airDate }, category: { not: PRACTICE_CATEGORY } },
      orderBy: { airDate: "asc" },
    });
    if (!oldest) return null;
    const rerun = await prisma.paradox.create({
      data: {
        title: oldest.title,
        description: oldest.description,
        optionA: oldest.optionA,
        optionB: oldest.optionB,
        category: oldest.category,
        submittedById: oldest.submittedById,
        airDate,
      },
      select: { id: true },
    });
    console.log(`[schedule] re-aired "${oldest.title}" on ${ymdStr}`);
    return rerun;
  } catch (e) {
    // Lost a race with another request filling the same day.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return prisma.paradox.findUnique({ where: { airDate }, select: { id: true } });
    }
    throw e;
  }
}

/** The unscheduled first-run practice paradox, created on demand. */
export async function ensurePracticeParadox(): Promise<{
  id: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
}> {
  const select = {
    id: true,
    title: true,
    description: true,
    optionA: true,
    optionB: true,
    category: true,
  } as const;
  const found = await prisma.paradox.findFirst({
    where: { category: PRACTICE_CATEGORY, airDate: null },
    select,
  });
  if (found) return found;
  return prisma.paradox.create({ data: { ...PRACTICE_PARADOX }, select });
}
