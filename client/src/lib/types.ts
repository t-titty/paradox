export type Tribe =
  | "Utilitarian"
  | "Deontologist"
  | "VirtueEthicist"
  | "Nihilist"
  | "Stoic"
  | "Existentialist"
  | "Hedonist";

export type Choice = "A" | "B";

export type Phase = "drop" | "vow" | "sort" | "duel" | "bridge";

export interface PhaseSchedule {
  timezone: string;
  dropHour: number;
  vowEndHour: number;
  duelHour: number;
}

export interface PhaseState {
  phase: Phase;
  today: string;
  nextTransitionAt: string;
  /** ISO time of the next Drop — rendered in the viewer's local time. */
  nextDropAt: string;
  testMode: boolean;
  schedule: PhaseSchedule;
  /** The phase is forced by the admin test clock (staging / dev). */
  clockOverridden?: boolean;
}

export interface StreakSummary {
  current: number;
  best: number;
  votedToday: boolean;
  freezesAvailable: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  wisdomPoints: number;
  civilityScore: number;
  isPremium?: boolean;
  isAdmin?: boolean;
  twoFactorEnabled?: boolean;
  /** Server-derived flag: granted by admin OR owns an active paid Circle. */
  hasCircleAccess?: boolean;
  /** Server-derived flag: true iff user is OWNER or ADMIN on any Circle.
   *  Distinct from hasCircleAccess — governs whether the MANAGE nav link
   *  is shown, not whether the user can *create* a new circle. */
  ownsOrAdminsCircle?: boolean;
  /** Server-derived effective test-mode flag: system env.TEST_MODE OR the
   *  admin-granted per-user testMode column. Drives the test-mode banner
   *  and phase switcher — hidden from regular users. */
  testMode?: boolean;
}

export interface Paradox {
  id: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
  airDate: string;
  submittedBy?: { username: string } | null;
}

export interface DailyTodayResponse {
  mode: "daily";
  paradox: Paradox;
  phase: PhaseState;
  hasVoted: boolean;
  vote: {
    choice: Choice;
    justification: string;
    tribeAssigned: Tribe | null;
    createdAt: string;
    isLate?: boolean;
  } | null;
  /** Admin-issued exemption letting this user vote on today's paradox
   *  regardless of phase. Present only when the grant exists and is
   *  unused; null otherwise. Drives the gold banner on the Today page. */
  lateVowGrant: { id: string; createdAt: string } | null;
  /** True iff an admin has opened the vow window for **every** user on
   *  today's paradox via GlobalLateVowGrant. Drives the global gold
   *  banner shown to all non-voters. */
  globalLateVowActive: boolean;
  /** Self-serve late vows are open (sort/duel phases) and you haven't voted. */
  lateVowOpen: boolean;
  /** The arena is open — human duels and AI spars. */
  duelsOpen: boolean;
  paradoxNumber: number | null;
  streak: StreakSummary;
  /** New account that hasn't done (or skipped) the practice round. */
  needsOnboarding: boolean;
}

export interface ThrowbackTodayResponse {
  mode: "throwback";
  phase: PhaseState;
  paradox: Paradox;
  originalVote: {
    choice: Choice;
    justification: string;
    createdAt: string;
  };
  originalVoteId: string;
  hasRevoted: boolean;
}

export type TodayResponse = DailyTodayResponse | ThrowbackTodayResponse;

export type Shift = "shifted" | "held" | "evolved";

export interface ThrowbackRevoteResponse {
  revote: {
    id: string;
    newChoice: Choice;
    newJustification: string;
    shift: Shift;
    createdAt: string;
  };
  original: {
    choice: Choice;
    justification: string;
    createdAt: string;
  };
}

export interface ParadoxResults {
  totalVotes: number;
  choiceCounts: { A: number; B: number };
  tribeCounts: Record<Tribe, number>;
  tribeChoice: Record<Tribe, { A: number; B: number }>;
}

export interface SortResponse {
  paradox: { id: string; title: string; number: number | null; airDate: string };
  yours: {
    choice: Choice;
    choiceText: string;
    justification: string;
    tribe: Tribe | null;
    confidence: number | null;
    reasoning: string | null;
    isLate: boolean;
    /** Share of all vows that chose the same side as you. */
    sidePct: number;
  };
  consensus: ParadoxResults;
  streak: StreakSummary;
  phase: PhaseState;
}

export interface PublicDay {
  date: string;
  number: number | null;
  paradox: Paradox;
  resultsOpen: boolean;
  results?: ParadoxResults;
  syntheses?: { id: string; tribeA: Tribe; tribeB: Tribe; synthesisText: string; signedAt: string }[];
  goldStars?: { id: string; tribe: Tribe; messageText: string; explanation: string }[];
}

export interface TribeWarsRow {
  tribe: Tribe;
  members: number;
  goldStars: number;
  redFlags: number;
  syntheses: number;
  score: number;
}
