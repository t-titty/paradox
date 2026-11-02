import type { Tribe } from "@prisma/client";

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
export const TRIBE_COORDS: Record<Tribe, [number, number, number]> = {
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

/**
 * Weekly Moral Drift: how this week's reasoning moved relative to the
 * previous few weeks. Pure — inputs are tribe lists for each window.
 */
export function computeDrift(
  thisWeek: Tribe[],
  baseline: Tribe[],
): {
  thisWeek: [number, number, number] | null;
  baseline: [number, number, number] | null;
  delta: [number, number, number] | null;
  dominantTribe: Tribe | null;
} {
  const mean = (list: Tribe[]): [number, number, number] | null => {
    if (list.length === 0) return null;
    const sum = list.reduce<[number, number, number]>(
      (acc, t) => {
        const c = TRIBE_COORDS[t];
        return [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]];
      },
      [0, 0, 0],
    );
    return [sum[0] / list.length, sum[1] / list.length, sum[2] / list.length];
  };
  const a = mean(thisWeek);
  const b = mean(baseline);
  const counts = new Map<Tribe, number>();
  for (const t of thisWeek) counts.set(t, (counts.get(t) ?? 0) + 1);
  let dominantTribe: Tribe | null = null;
  let max = 0;
  for (const [t, n] of counts) {
    if (n > max) {
      dominantTribe = t;
      max = n;
    }
  }
  return {
    thisWeek: a,
    baseline: b,
    delta: a && b ? [a[0] - b[0], a[1] - b[1], a[2] - b[2]] : null,
    dominantTribe,
  };
}
