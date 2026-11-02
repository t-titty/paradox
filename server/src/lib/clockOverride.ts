import { prisma } from "../db.js";
import { env } from "../env.js";

/**
 * Admin "test clock": force the whole game into one phase from the admin
 * panel, without editing env vars or redeploying. Only available where
 * ALLOW_CLOCK_OVERRIDE=true (local dev and staging) — never in production.
 *
 * Stored in SystemSetting so every server process agrees, and cached in
 * memory because resolvePhase() is synchronous and called constantly.
 */
export const CLOCK_OVERRIDE_KEY = "PHASE_OVERRIDE";
export const CLOCK_PHASES = ["vow", "sort", "duel", "bridge"] as const;
export type ClockPhase = (typeof CLOCK_PHASES)[number];

let cached: ClockPhase | null = null;
let timer: NodeJS.Timeout | null = null;

export function runtimeClockOverride(): ClockPhase | null {
  return env.ALLOW_CLOCK_OVERRIDE ? cached : null;
}

export async function refreshClockOverride(): Promise<void> {
  if (!env.ALLOW_CLOCK_OVERRIDE) {
    cached = null;
    return;
  }
  const row = await prisma.systemSetting.findUnique({ where: { key: CLOCK_OVERRIDE_KEY } });
  const v = row?.value ?? "";
  cached = (CLOCK_PHASES as readonly string[]).includes(v) ? (v as ClockPhase) : null;
}

export async function setClockOverride(phase: ClockPhase | null): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: CLOCK_OVERRIDE_KEY },
    create: { key: CLOCK_OVERRIDE_KEY, value: phase ?? "off" },
    update: { value: phase ?? "off" },
  });
  cached = phase;
}

export function startClockOverrideSync(): void {
  if (!env.ALLOW_CLOCK_OVERRIDE || timer) return;
  void refreshClockOverride().catch(() => undefined);
  timer = setInterval(() => void refreshClockOverride().catch(() => undefined), 15_000);
  timer.unref();
}
