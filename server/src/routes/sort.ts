import { Router } from "express";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, resolvePhase } from "../phases.js";
import { sortIntoTribe, TRIBES, type TribeName } from "../lib/oracle.js";

export const sortRouter = Router();

/**
 * GET /api/sort/me
 * Phase III — The Sort.
 *
 * If the caller has voted today and not yet been sorted, call the Oracle now
 * (lazy sort). Return the caller's tribe plus today's global consensus so the
 * client can render the tribe-vs-world visualization.
 *
 * The spec says sorting begins at 12:00 PM. Before that we return 425 so the
 * client can show "not yet" UI. PHASE_OVERRIDE skips the gate for demos.
 */
sortRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const phase = resolvePhase();
    const airDate = parseYmd(phase.today);

    // Test mode: "Sort Me Now" — skip the phase gate entirely.
    if (!env.TEST_MODE && (phase.phase === "vow" || phase.phase === "bridge")) {
      throw new HttpError(425, "Sorting begins after the Vow closes.", "phase_early");
    }

    const paradox = await prisma.paradox.findUnique({
      where: { airDate },
      select: { id: true, title: true, description: true, optionA: true, optionB: true },
    });
    if (!paradox) throw new HttpError(404, "No paradox for today", "no_paradox_today");

    const vote = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
    });
    if (!vote) {
      throw new HttpError(
        403,
        "You did not vow today. No tribe to report.",
        "no_vote",
      );
    }

    // Lazy sort: if Oracle hasn't assigned yet, do it now.
    let tribe = vote.tribeAssigned as TribeName | null;
    let confidence = vote.tribeConfidence;
    let reasoning = vote.tribeReasoning;

    if (!tribe) {
      const choiceText = vote.choice === "A" ? paradox.optionA : paradox.optionB;
      const result = await sortIntoTribe({
        paradoxTitle: paradox.title,
        paradoxDescription: paradox.description,
        choiceText,
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
        prisma.tribeHistory.upsert({
          where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
          create: { userId, paradoxId: paradox.id, tribe: result.tribe, airDate },
          update: { tribe: result.tribe },
        }),
      ]);

      tribe = result.tribe;
      confidence = result.confidence;
      reasoning = result.reasoning;
    }

    // Global consensus — vote split + tribe distribution (only among sorted users).
    const [choiceCountsRaw, tribeCountsRaw] = await Promise.all([
      prisma.vote.groupBy({
        by: ["choice"],
        where: { paradoxId: paradox.id },
        _count: { _all: true },
      }),
      prisma.vote.groupBy({
        by: ["tribeAssigned"],
        where: { paradoxId: paradox.id, tribeAssigned: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const choiceCounts = { A: 0, B: 0 };
    for (const row of choiceCountsRaw) choiceCounts[row.choice] = row._count._all;

    const tribeCounts = Object.fromEntries(TRIBES.map((t) => [t, 0])) as Record<TribeName, number>;
    for (const row of tribeCountsRaw) {
      if (row.tribeAssigned) tribeCounts[row.tribeAssigned as TribeName] = row._count._all;
    }

    res.json({
      paradox: { id: paradox.id, title: paradox.title },
      yours: {
        choice: vote.choice,
        choiceText: vote.choice === "A" ? paradox.optionA : paradox.optionB,
        justification: vote.justification,
        tribe,
        confidence,
        reasoning,
      },
      consensus: {
        totalVotes: choiceCounts.A + choiceCounts.B,
        choiceCounts,
        tribeCounts,
      },
      phase,
    });
  } catch (e) {
    next(e);
  }
});
