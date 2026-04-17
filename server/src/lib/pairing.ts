import type { TribeName } from "./oracle.js";

/**
 * Tribe opposition scores — higher = sharper philosophical opposition.
 * Used by the matchmaker to find the best available opponent.
 *
 * Canonical pairs (10):
 *   Utilitarian    vs Deontologist   — outcomes vs duty
 *   Stoic          vs Hedonist        — discipline vs pleasure
 *   VirtueEthicist vs Nihilist        — meaning-via-character vs void
 *
 * Existentialist is the "wild card" — strongly opposes Stoic (create meaning
 * vs accept fate) and Deontologist (self-authored vs rule-bound), clashes
 * moderately with most others.
 *
 * Same tribe: 0. The matcher only falls back to same-tribe if the queue has
 * no other choice and timeout is imminent.
 */
const OPPOSITION: Record<TribeName, Record<TribeName, number>> = {
  Utilitarian: {
    Utilitarian: 0,
    Deontologist: 10,
    VirtueEthicist: 6,
    Nihilist: 7,
    Stoic: 5,
    Existentialist: 6,
    Hedonist: 5,
  },
  Deontologist: {
    Utilitarian: 10,
    Deontologist: 0,
    VirtueEthicist: 5,
    Nihilist: 6,
    Stoic: 4,
    Existentialist: 8,
    Hedonist: 8,
  },
  VirtueEthicist: {
    Utilitarian: 6,
    Deontologist: 5,
    VirtueEthicist: 0,
    Nihilist: 10,
    Stoic: 3,
    Existentialist: 5,
    Hedonist: 7,
  },
  Nihilist: {
    Utilitarian: 7,
    Deontologist: 6,
    VirtueEthicist: 10,
    Nihilist: 0,
    Stoic: 5,
    Existentialist: 9,
    Hedonist: 6,
  },
  Stoic: {
    Utilitarian: 5,
    Deontologist: 4,
    VirtueEthicist: 3,
    Nihilist: 5,
    Stoic: 0,
    Existentialist: 8,
    Hedonist: 10,
  },
  Existentialist: {
    Utilitarian: 6,
    Deontologist: 8,
    VirtueEthicist: 5,
    Nihilist: 9,
    Stoic: 8,
    Existentialist: 0,
    Hedonist: 5,
  },
  Hedonist: {
    Utilitarian: 5,
    Deontologist: 8,
    VirtueEthicist: 7,
    Nihilist: 6,
    Stoic: 10,
    Existentialist: 5,
    Hedonist: 0,
  },
};

export function oppositionScore(a: TribeName, b: TribeName): number {
  return OPPOSITION[a][b];
}

/** Minimum score considered acceptable under normal matchmaking. Below this, we wait. */
export const MIN_OPPOSITION_FOR_MATCH = 4;
