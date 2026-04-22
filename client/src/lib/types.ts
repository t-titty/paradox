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
