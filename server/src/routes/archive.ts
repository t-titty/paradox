import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { Prisma, Tribe } from "@prisma/client";

export const archiveRouter = Router();

const querySchema = z.object({
  paradox: z.string().optional(),
  tribeA: z.nativeEnum(Tribe).optional(),
  tribeB: z.nativeEnum(Tribe).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * GET /api/archive
 * Public listing of signed Synthesis Statements. Filters by paradox title
 * (exact match) and by tribe pair (order-agnostic — {A:Util, B:Deon} and
 * {A:Deon, B:Util} both hit).
 *
 * Cursor-based pagination on id (cuid), descending by signedAt.
 */
archiveRouter.get("/", async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query);

    const where: Prisma.SynthesisArchiveWhereInput = {};
    if (q.paradox) where.paradoxTitle = q.paradox;
    if (q.tribeA && q.tribeB) {
      where.OR = [
        { tribeA: q.tribeA, tribeB: q.tribeB },
        { tribeA: q.tribeB, tribeB: q.tribeA },
      ];
    } else if (q.tribeA) {
      where.OR = [{ tribeA: q.tribeA }, { tribeB: q.tribeA }];
    } else if (q.tribeB) {
      where.OR = [{ tribeA: q.tribeB }, { tribeB: q.tribeB }];
    }

    const entries = await prisma.synthesisArchive.findMany({
      where,
      orderBy: [{ signedAt: "desc" }, { id: "desc" }],
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        paradoxTitle: true,
        tribeA: true,
        tribeB: true,
        synthesisText: true,
        signedAt: true,
      },
    });

    const hasMore = entries.length > q.limit;
    const page = hasMore ? entries.slice(0, q.limit) : entries;
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    // Facets — paradoxes and tribes that have at least one entry.
    const [paradoxFacet, tribeCounts] = await Promise.all([
      prisma.synthesisArchive.groupBy({
        by: ["paradoxTitle"],
        _count: { _all: true },
        orderBy: { _count: { paradoxTitle: "desc" } },
        take: 50,
      }),
      prisma.synthesisArchive.groupBy({
        by: ["tribeA", "tribeB"],
        _count: { _all: true },
      }),
    ]);

    res.json({
      entries: page,
      nextCursor,
      facets: {
        paradoxTitles: paradoxFacet.map((p) => ({ title: p.paradoxTitle, count: p._count._all })),
        tribePairs: tribeCounts.map((t) => ({
          tribeA: t.tribeA,
          tribeB: t.tribeB,
          count: t._count._all,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
});
