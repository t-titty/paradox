import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { TRIBES, type TribeName } from "./oracle.js";
import { oppositionScore } from "./pairing.js";

/**
 * The AI sparring partner plays from a bot account (one per tribe) because
 * Duel rows need a real User on both sides. Bot usernames contain a
 * character ("·") that registration rejects, so they can never collide
 * with — or be impersonated by — a human account, and the password is a
 * random hash nobody knows.
 */

export const BOT_LABEL: Record<TribeName, string> = {
  Utilitarian: "THE UTILITARIAN SHADE",
  Deontologist: "THE DEONTOLOGIST SHADE",
  VirtueEthicist: "THE VIRTUE SHADE",
  Nihilist: "THE NIHILIST SHADE",
  Stoic: "THE STOIC SHADE",
  Existentialist: "THE EXISTENTIALIST SHADE",
  Hedonist: "THE HEDONIST SHADE",
};

function botUsername(tribe: TribeName): string {
  return `Oracle·${tribe}`;
}

const cache = new Map<TribeName, { id: string; username: string }>();

export async function ensureBotUser(tribe: TribeName): Promise<{ id: string; username: string }> {
  const hit = cache.get(tribe);
  if (hit) return hit;
  const username = botUsername(tribe);
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true } });
  if (existing) {
    cache.set(tribe, existing);
    return existing;
  }
  const hashedPassword = await bcrypt.hash(crypto.randomBytes(48).toString("hex"), 10);
  const created = await prisma.user.upsert({
    where: { username },
    create: {
      username,
      email: `bot+${tribe.toLowerCase()}@paradox.invalid`,
      hashedPassword,
      isBot: true,
      onboardedAt: new Date(),
    },
    update: {},
    select: { id: true, username: true },
  });
  cache.set(tribe, created);
  return created;
}

/** The tribe most opposed to `tribe` — the sparring partner's school. */
export function sparringTribeFor(tribe: TribeName): TribeName {
  let best: TribeName = TRIBES[0];
  let bestScore = -1;
  for (const t of TRIBES) {
    if (t === tribe) continue;
    const score = oppositionScore(tribe, t);
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}
