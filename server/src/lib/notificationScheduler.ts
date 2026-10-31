import { prisma } from "../db.js";
import { env } from "../env.js";
import { parseYmd } from "../phases.js";
import { pushConfigured, sendPushToAll, sendPushToUser, type PushPayload } from "./push.js";
import { computeStreakForUser } from "./streaks.js";
import { zonedParts, zonedYmd } from "./time.js";

/**
 * Phase-kickoff push notifications on the game clock (PHASE_TIMEZONE):
 * Drop, Vow close, prime-time Duel bell, plus a streak-saver reminder and
 * the Sunday weekly-drift nudge. A background
 * interval checks every minute and fires any window whose time has
 * arrived and hasn't fired yet today. "Already fired today" is persisted
 * in SystemSetting so a server restart within a window doesn't re-fire.
 */
interface PhaseWindow {
  /** Human-readable key for logs. */
  name: "DROP" | "VOW" | "DUEL";
  /** 24-hour local clock hour (0–23). */
  hour: number;
  /** SystemSetting key that stores the last-fired YYYY-MM-DD. */
  settingKey: string;
  payload: PushPayload;
}

function windows(): readonly PhaseWindow[] {
  return [
    {
      name: "DROP",
      hour: env.PHASE_DROP_HOUR,
      settingKey: "NOTIF_LAST_DROP_DATE",
      payload: {
        title: "THE DROP IS LIVE.",
        body: "Your paradox awaits. Take the Vow.",
        url: "/",
      },
    },
    {
      name: "VOW",
      hour: env.PHASE_VOW_END_HOUR,
      settingKey: "NOTIF_LAST_VOW_DATE",
      payload: {
        title: "THE ORACLE HAS READ YOU.",
        body: "Your tribe is revealed and the arena is open. Find your opposite.",
        url: "/",
      },
    },
    {
      name: "DUEL",
      hour: env.PHASE_SORT_END_HOUR,
      settingKey: "NOTIF_LAST_DUEL_DATE",
      payload: {
        title: "PRIME TIME. THE DUEL BELL RINGS.",
        body: "The arena is at its busiest. Ten minutes. Three combat modes.",
        url: "/",
      },
    },
  ];
}

async function claimSlot(settingKey: string, value: string): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: settingKey },
    select: { value: true },
  });
  if (setting?.value === value) return false;
  // Claim the slot *before* sending so a crash between send and update
  // doesn't cause a re-fire on the next tick. Worst case if send fails:
  // we skipped one notification. That's better than spamming.
  await prisma.systemSetting.upsert({
    where: { key: settingKey },
    create: { key: settingKey, value },
    update: { value },
  });
  return true;
}

async function maybeFire(window: PhaseWindow, now: Date): Promise<void> {
  // Only consider firing once we're past the window's hour (game clock).
  // A restart mid-window still fires because lastFiredDate isn't today yet.
  const tz = env.PHASE_TIMEZONE;
  if (zonedParts(now, tz).hour < window.hour) return;
  const todayStr = zonedYmd(now, tz);
  if (!(await claimSlot(window.settingKey, todayStr))) return;

  const result = await sendPushToAll(window.payload);
  console.log(
    `[notifications] ${window.name} fired · sent=${result.sent} pruned=${result.pruned} failed=${result.failed}`,
  );
}

/**
 * Streak saver: two hours before the Vow closes, nudge everyone who has a
 * live streak (>= 2 days) but has not voted today.
 */
async function maybeStreakReminder(now: Date): Promise<void> {
  const tz = env.PHASE_TIMEZONE;
  const hour = zonedParts(now, tz).hour;
  const remindAt = Math.max(env.PHASE_DROP_HOUR, env.PHASE_VOW_END_HOUR - 2);
  if (hour < remindAt || hour >= env.PHASE_VOW_END_HOUR) return;
  const todayStr = zonedYmd(now, tz);
  if (!(await claimSlot("NOTIF_LAST_STREAK_DATE", todayStr))) return;

  const paradox = await prisma.paradox.findUnique({
    where: { airDate: parseYmd(todayStr) },
    select: { id: true },
  });
  if (!paradox) return;

  const subscribers = await prisma.pushSubscription.findMany({
    distinct: ["userId"],
    select: { userId: true },
  });
  let sent = 0;
  for (const { userId } of subscribers) {
    const voted = await prisma.vote.findUnique({
      where: { userId_paradoxId: { userId, paradoxId: paradox.id } },
      select: { id: true },
    });
    if (voted) continue;
    const streak = await computeStreakForUser(userId, todayStr);
    if (streak.current < 2) continue;
    await sendPushToUser(userId, {
      title: `YOUR ${streak.current}-DAY STREAK IS ON THE LINE.`,
      body: "The Vow closes in two hours. One sentence keeps it alive.",
      url: "/",
    });
    sent++;
  }
  console.log(`[notifications] streak reminders sent=${sent}`);
}

/** Sunday evening: the weekly Moral Drift report is ready. */
async function maybeWeeklyDrift(now: Date): Promise<void> {
  const tz = env.PHASE_TIMEZONE;
  const p = zonedParts(now, tz);
  if (p.weekday !== 0 || p.hour < 18) return;
  const todayStr = zonedYmd(now, tz);
  if (!(await claimSlot("NOTIF_LAST_DRIFT_DATE", todayStr))) return;
  const result = await sendPushToAll({
    title: "YOUR WEEKLY MORAL DRIFT IS IN.",
    body: "See where your reasoning moved this week.",
    url: "/me",
  });
  console.log(`[notifications] weekly drift sent=${result.sent}`);
}

let intervalHandle: NodeJS.Timeout | null = null;

/**
 * Start the per-minute scheduler. No-op (and logs a warning) when VAPID
 * isn't configured — rather than boot-block prod, we let the server come
 * up and simply not push. Idempotent: calling start() twice reuses the
 * existing interval. `unref()` so the tick doesn't hold the process
 * alive on graceful shutdown.
 */
export function startNotificationScheduler(): void {
  if (intervalHandle !== null) return;
  if (!pushConfigured()) {
    console.log(
      "[notifications] VAPID keys not set — scheduler disabled (routes will still 503 until configured).",
    );
    return;
  }

  const tick = async () => {
    const now = new Date();
    for (const window of windows()) {
      try {
        await maybeFire(window, now);
      } catch (err) {
        console.error(
          `[notifications] ${window.name} tick failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
    for (const [name, job] of [
      ["STREAK", maybeStreakReminder],
      ["DRIFT", maybeWeeklyDrift],
    ] as const) {
      try {
        await job(now);
      } catch (err) {
        console.error(`[notifications] ${name} tick failed:`, err instanceof Error ? err.message : err);
      }
    }
  };

  // Run once immediately so a deploy shortly after a window boundary
  // catches up, then every 60s.
  void tick();
  intervalHandle = setInterval(tick, 60 * 1000);
  intervalHandle.unref();
  console.log("[notifications] scheduler started (1 min cadence)");
}

export function stopNotificationScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
