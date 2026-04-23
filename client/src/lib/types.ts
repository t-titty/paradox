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

export interface PhaseState {
  phase: Phase;
  today: string;
  nextTransitionAt: string;
  testMode: boolean;
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
  } | null;
  /** Admin-issued exemption letting this user vote on today's paradox
   *  regardless of phase. Present only when the grant exists and is
   *  unused; null otherwise. Drives the gold banner on the Today page. */
  lateVowGrant: { id: string; createdAt: string } | null;
  /** True iff an admin has opened the vow window for **every** user on
   *  today's paradox via GlobalLateVowGrant. Drives the global gold
   *  banner shown to all non-voters. */
  globalLateVowActive: boolean;
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

export interface SortResponse {
  paradox: { id: string; title: string };
  yours: {
    choice: Choice;
    choiceText: string;
    justification: string;
    tribe: Tribe | null;
    confidence: number | null;
    reasoning: string | null;
  };
  consensus: {
    totalVotes: number;
    choiceCounts: { A: number; B: number };
    tribeCounts: Record<Tribe, number>;
  };
  phase: PhaseState;
}
