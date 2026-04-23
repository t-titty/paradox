import { prisma } from "../db.js";
import { pushConfigured, sendPushToAll, type PushPayload } from "./push.js";

/**
 * Phase-kickoff push notifications. Three fixed times per server-local
 * day (Drop at 08:00, Vow close at 12:00, Duel at 20:00). A background
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

const WINDOWS: readonly PhaseWindow[] = [
  {
    name: "DROP",
    hour: 8,
    settingKey: "NOTIF_LAST_DROP_DATE",
    payload: {
      title: "THE DROP IS LIVE.",
      body: "Your paradox awaits. Take the Vow.",
      url: "/",
    },
  },
  {
    name: "VOW",
    hour: 12,
    settingKey: "NOTIF_LAST_VOW_DATE",
    payload: {
      title: "THE VOW IS CLOSED.",
      body: "The Oracle is sorting tribes. The Duel begins at 8 PM.",
      url: "/",
    },
  },
  {
    name: "DUEL",
    hour: 20,
    settingKey: "NOTIF_LAST_DUEL_DATE",
    payload: {
      title: "THE DUEL BEGINS.",
      body: "Find your opposite. Ten minutes. Three combat modes.",
      url: "/",
    },
  },
];

/** YYYY-MM-DD from a Date in local server time. */
function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function maybeFire(window: PhaseWindow, now: Date): Promise<void> {
  // Only consider firing once we're past the window's hour. If we're
  // pre-hour (e.g. server just started at 07:58), we'll be checked again
  // on the next minute tick; if we missed the exact minute because of a
  // restart (e.g. started at 08:30) we still fire since lastFiredDate
  // isn't today yet.
  if (now.getHours() < window.hour) return;
  const todayStr = ymdLocal(now);

  const setting = await prisma.systemSetting.findUnique({
    where: { key: window.settingKey },
    select: { value: true },
  });
  if (setting?.value === todayStr) return; // already fired this window today

  // Claim the slot *before* sending so a crash between send and update
  // doesn't cause a re-fire on the next tick. Worst case if send fails:
  // we skipped one day's notification. That's better than spamming.
  await prisma.systemSetting.upsert({
    where: { key: window.settingKey },
    create: { key: window.settingKey, value: todayStr },
    update: { value: todayStr },
  });

  const result = await sendPushToAll(window.payload);
  console.log(
    `[notifications] ${window.name} fired · sent=${result.sent} pruned=${result.pruned} failed=${result.failed}`,
  );
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
    for (const window of WINDOWS) {
      try {
        await maybeFire(window, now);
      } catch (err) {
        console.error(
          `[notifications] ${window.name} tick failed:`,
          err instanceof Error ? err.message : err,
        );
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
