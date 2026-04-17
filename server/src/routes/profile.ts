import { Router } from "express";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import type { Tribe } from "@prisma/client";
import { TRIBES, type TribeName } from "../lib/oracle.js";

export const profileRouter = Router();

/**
 * GET /api/profile/:username
 * Public. Returns everything the Moral Constellation page needs:
 *   - WP + civility
 *   - Full tribe history (ordered by airDate)
 *   - Tribe frequency counts
 *   - Pre-computed constellation coordinates
 *
 * The client does the 3D rendering; we do the math that shouldn't live
 * in the browser.
 */
profileRouter.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    if (!username) throw new HttpError(400, "Missing username", "bad_request");

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        wisdomPoints: true,
        civilityScore: true,
        isPremium: true,
        createdAt: true,
      },
    });
    if (!user) throw new HttpError(404, "User not found", "not_found");

    const history = await prisma.tribeHistory.findMany({
      where: { userId: user.id },
      orderBy: { airDate: "asc" },
      select: {
        tribe: true,
        airDate: true,
        paradox: { select: { id: true, title: true, category: true } },
      },
    });

    const tribeCounts = Object.fromEntries(TRIBES.map((t) => [t, 0])) as Record<TribeName, number>;
    for (const row of history) tribeCounts[row.tribe as TribeName]++;

    const constellation = computeConstellation(history.map((h) => h.tribe));

    res.json({
      user,
      history: history.map((h) => ({
        tribe: h.tribe,
        airDate: h.airDate,
        paradox: h.paradox,
      })),
      tribeCounts,
      constellation,
    });
  } catch (e) {
    next(e);
  }
});

/* ──────────────────────────────────────────────────────────────────────── */
/* Constellation math — pure, deterministic, easy to unit-test later.       */
/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Each tribe has a canonical 3D position in philosophical space.
 *
 *   X axis: Deontology (-1) ←→ Consequentialism (+1)
 *   Y axis: Individualism (-1) ←→ Collectivism (+1)
 *   Z axis: Emotional (-1) ←→ Rational (+1)
 */
const TRIBE_COORDS: Record<Tribe, [number, number, number]> = {
  Utilitarian: [0.9, 0.8, 0.6],
  Deontologist: [-0.9, 0.3, 0.6],
  VirtueEthicist: [-0.2, 0.1, 0.0],
  Nihilist: [0.2, -0.4, 0.5],
  Stoic: [-0.4, -0.1, 0.9],
  Existentialist: [0.1, -0.7, -0.5],
  Hedonist: [0.6, -0.8, -0.7],
};

export function computeConstellation(history: Tribe[]): {
  position: [number, number, number];
  axes: { x: number; y: number; z: number };
  trajectory: { tribe: Tribe; position: [number, number, number] }[];
} {
  if (history.length === 0) {
    return {
      position: [0, 0, 0],
      axes: { x: 0, y: 0, z: 0 },
      trajectory: [],
    };
  }

  // Recent tribes weigh more. Linear ramp from 0.5 (oldest) to 1.0 (newest).
  const n = history.length;
  let wx = 0,
    wy = 0,
    wz = 0,
    wsum = 0;
  const trajectory: { tribe: Tribe; position: [number, number, number] }[] = [];

  for (let i = 0; i < n; i++) {
    const tribe = history[i]!;
    const coord = TRIBE_COORDS[tribe];
    const weight = 0.5 + 0.5 * (i / Math.max(1, n - 1));
    wx += coord[0] * weight;
    wy += coord[1] * weight;
    wz += coord[2] * weight;
    wsum += weight;
    trajectory.push({ tribe, position: coord });
  }

  const x = wx / wsum;
  const y = wy / wsum;
  const z = wz / wsum;

  return {
    position: [x, y, z],
    axes: { x, y, z },
    trajectory,
  };
}
