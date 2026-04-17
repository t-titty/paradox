import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const libraryRouter = Router();

/**
 * GET /api/library
 *
 * Monetization stub: returns a "Deep Dive" entry per paradox. The body is a
 * placeholder — real editorial content will live somewhere else (CMS, Notion,
 * etc.) and get injected later. The `isPremium` flag reflects the caller's
 * own premium status, used by the client to render locked/unlocked state.
 */
libraryRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    const paradoxes = await prisma.paradox.findMany({
      orderBy: { airDate: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        airDate: true,
      },
    });

    const deepDives = paradoxes.map((p) => ({
      paradoxId: p.id,
      paradoxTitle: p.title,
      category: p.category,
      airDate: p.airDate,
      title: `Deep Dive — ${p.title}`,
      // The editorial pipeline hasn't shipped yet; expose the stub shape so
      // the client can render cards today and we swap in real prose later.
      preview:
        "Context, history, and the moral philosophy behind this paradox. Read the full essay with PARADOX Premium.",
      locked: !user?.isPremium,
    }));

    res.json({ deepDives, isPremium: !!user?.isPremium });
  } catch (e) {
    next(e);
  }
});
