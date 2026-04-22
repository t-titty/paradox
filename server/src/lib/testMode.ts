import { prisma } from "../db.js";
import { resolvePhase, type Phase, type PhaseState } from "../phases.js";

/**
 * Key for the TEST_MODE toggle in the SystemSetting table. Values are
 * stored as "true" / "false" strings.
 */
export const TEST_MODE_SETTING_KEY = "TEST_MODE";

/**
 * Effective test-mode flag for a single user. True when BOTH:
 *   - the user is an admin (non-admins never see test mode UI), AND
 *   - the global SystemSetting.TEST_MODE row exists and holds "true".
 *
 * Regular users always get `false` regardless of the system setting, so
 * the banner, phase switcher, and bypass gates stay invisible to them.
 *
 * Callers that phase-gate behavior (vote/sort/throwback/paradox) use this
 * to decide whether to honor a requested phase override and whether to
 * bypass date-check / phase locks.
 */
export async function effectiveTestMode(
  userId?: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) return false;
  return systemTestModeEnabled();
}

/**
 * Read the system-wide TEST_MODE toggle from SystemSetting. Returns false
 * when the row doesn't exist yet (first-deploy default) or when parsing
 * fails — "fail closed" keeps test-mode off by default.
 */
export async function systemTestModeEnabled(): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: TEST_MODE_SETTING_KEY },
    select: { value: true },
  });
  return setting?.value === "true";
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
 * `resolvePhase()` directly, which is env-only and never test-mode-aware.
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
