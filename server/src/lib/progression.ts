/**
 * Titles and badges. Pure functions over a stats snapshot so they can be
 * unit-tested and reused by the profile page and the share card.
 */

export interface Title {
  key: string;
  label: string;
  minWp: number;
}

export const TITLES: Title[] = [
  { key: "initiate", label: "INITIATE", minWp: 0 },
  { key: "sophist", label: "SOPHIST", minWp: 50 },
  { key: "dialectician", label: "DIALECTICIAN", minWp: 200 },
  { key: "philosopher", label: "PHILOSOPHER", minWp: 500 },
  { key: "sage", label: "SAGE", minWp: 1500 },
  { key: "oracle_touched", label: "ORACLE-TOUCHED", minWp: 5000 },
];

export function titleFor(wp: number): { current: Title; next: Title | null; progress: number } {
  let idx = 0;
  for (let i = 0; i < TITLES.length; i++) if (wp >= TITLES[i]!.minWp) idx = i;
  const current = TITLES[idx]!;
  const next = TITLES[idx + 1] ?? null;
  const progress = next ? (wp - current.minWp) / (next.minWp - current.minWp) : 1;
  return { current, next, progress: Math.max(0, Math.min(1, progress)) };
}

export interface BadgeStats {
  votes: number;
  bestStreak: number;
  pvpDuels: number;
  spars: number;
  syntheses: number;
  goldStars: number;
  shiftedThrowbacks: number;
  distinctTribes: number;
  airedSubmissions: number;
}

export interface Badge {
  key: string;
  label: string;
  description: string;
  earned: boolean;
}

const BADGES: { key: string; label: string; description: string; test: (s: BadgeStats) => boolean }[] = [
  { key: "first_vow", label: "FIRST VOW", description: "Cast your first vow.", test: (s) => s.votes >= 1 },
  { key: "week_streak", label: "SEVEN DAYS", description: "Reach a 7-day vow streak.", test: (s) => s.bestStreak >= 7 },
  { key: "month_streak", label: "THIRTY DAYS", description: "Reach a 30-day vow streak.", test: (s) => s.bestStreak >= 30 },
  { key: "first_duel", label: "FIRST BLOOD", description: "Finish a duel against a human opposite.", test: (s) => s.pvpDuels >= 1 },
  { key: "sparring", label: "SHADOWBOXER", description: "Spar with the Oracle's partner.", test: (s) => s.spars >= 1 },
  { key: "first_synthesis", label: "BRIDGE STANDS", description: "Co-sign your first Synthesis.", test: (s) => s.syntheses >= 1 },
  { key: "bridge_builder", label: "BRIDGE BUILDER", description: "Co-sign five Syntheses.", test: (s) => s.syntheses >= 5 },
  { key: "gold_10", label: "GILDED", description: "Earn ten Gold Stars.", test: (s) => s.goldStars >= 10 },
  { key: "changed_mind", label: "CHANGED MY MIND", description: "Flip your vote on a Throwback Thursday.", test: (s) => s.shiftedThrowbacks >= 1 },
  { key: "seven_tribes", label: "WANDERER", description: "Be sorted into all seven tribes.", test: (s) => s.distinctTribes >= 7 },
  { key: "author", label: "AUTHOR", description: "Have a dilemma you wrote go live.", test: (s) => s.airedSubmissions >= 1 },
];

export function badgesFor(stats: BadgeStats): Badge[] {
  return BADGES.map((b) => ({ key: b.key, label: b.label, description: b.description, earned: b.test(stats) }));
}
