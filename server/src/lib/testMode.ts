import { env } from "../env.js";
import { prisma } from "../db.js";
import { resolvePhase, type Phase, type PhaseState } from "../phases.js";

/**
 * Effective test-mode flag for a single user. True when either:
 *   - the system-wide TEST_MODE env var is on (affects everyone), OR
 *   - an admin has flipped this user's per-user `testMode` column.
 *
 * Authed routes that phase-gate behavior (vote/sort/throwback/paradox) call
 * this to decide whether to honor a requested phase override and whether to
 * bypass date-check / phase locks. Returns `env.TEST_MODE` when no userId
 * is provided — matches the pre-auth /api/health semantics.
 */
export async function effectiveTestMode(
  userId?: string | null,
): Promise<boolean> {
  if (env.TEST_MODE) return true;
  if (!userId) return false;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { testMode: true },
  });
  return Boolean(row?.testMode);
}

function isPhase(v: string): v is Phase {
  return (
    v === "drop" ||
    v === "vow" ||
    v === "sort" ||
    v === "duel" ||
    v === "bridge"
  );
}

/**
 * Per-user phase resolution. Returns the usual PhaseState but with the
 * `testMode` flag set to the user's effective value and — if that flag is
 * on — honors `requestedPhase` as an override. Callers that don't have a
 * user in hand (socket code, cron-style jobs) should keep using
 * `resolvePhase()` directly, which reflects the system env flag only.
 */
export async function resolvePhaseForUser(
  userId: string,
  requestedPhase?: string | null,
  now: Date = new Date(),
): Promise<PhaseState> {
  const testMode = await effectiveTestMode(userId);
  const base = resolvePhase(now);
  const withFlag: PhaseState = { ...base, testMode };
  if (!testMode || !requestedPhase || !isPhase(requestedPhase)) return withFlag;
  return { ...withFlag, phase: requestedPhase };
}
