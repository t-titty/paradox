import type { Tribe } from "./types.ts";

export const TRIBE_ORDER: Tribe[] = [
  "Utilitarian",
  "Deontologist",
  "VirtueEthicist",
  "Nihilist",
  "Stoic",
  "Existentialist",
  "Hedonist",
];

export const TRIBE_LABEL: Record<Tribe, string> = {
  Utilitarian: "UTILITARIAN",
  Deontologist: "DEONTOLOGIST",
  VirtueEthicist: "VIRTUE ETHICIST",
  Nihilist: "NIHILIST",
  Stoic: "STOIC",
  Existentialist: "EXISTENTIALIST",
  Hedonist: "HEDONIST",
};

/** One glyph per tribe — used on share cards and compact badges. */
export const TRIBE_GLYPH: Record<Tribe, string> = {
  Utilitarian: "⚖️",
  Deontologist: "📜",
  VirtueEthicist: "🛡️",
  Nihilist: "🕳️",
  Stoic: "🏛️",
  Existentialist: "🔥",
  Hedonist: "🍷",
};

export const TRIBE_CREED: Record<Tribe, string> = {
  Utilitarian: "The right act maximizes total well-being. Outcomes are the scoreboard.",
  Deontologist: "Some acts are wrong regardless of outcome. Duties and rights are non-negotiable.",
  VirtueEthicist: "Ask what a person of good character would do. The actor matters more than the act.",
  Nihilist: "Moral claims have no objective ground. All values are constructed — argue anyway.",
  Stoic: "Focus on what is in your control. Right action flows from reason, not passion.",
  Existentialist: "Meaning is made through choice. You are responsible for the values you commit to.",
  Hedonist: "Pleasure is the good, pain is the bad. Pick the life that feels worth living.",
};

/** Human wording for the Oracle's confidence score. */
export function confidenceLabel(c: number | null): string {
  if (c === null) return "";
  if (c >= 0.85) return "A PARADIGM CASE";
  if (c >= 0.7) return "A CLEAR READ";
  if (c >= 0.55) return "A THIN BUT CLEAR SIGNAL";
  return "A BORDERLINE CALL";
}
