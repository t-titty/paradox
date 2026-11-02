/**
 * Time-zone helpers. The whole game runs on one clock — the "game zone"
 * (env PHASE_TIMEZONE, an IANA name such as "America/New_York") — so every
 * player shares the same Drop, Vow close and Duel bell regardless of where
 * the server happens to be hosted (Railway runs in UTC).
 *
 * Implemented with Intl only; no tz database dependency.
 */

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday, in the zone. */
  weekday: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock parts of `date` as seen in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = formatter(timeZone).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAYS[get("weekday")] ?? 0,
  };
}

/** Offset (ms) of `timeZone` from UTC at instant `date`. Positive east of UTC. */
export function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/**
 * The UTC instant at which the wall clock in `timeZone` reads
 * year-month-day hour:00. Handles DST by re-checking the offset at the
 * candidate instant. `day` may overflow (e.g. day + 1) — Date.UTC normalises.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  let offset = zoneOffsetMs(new Date(guess), timeZone);
  let candidate = guess - offset;
  const offset2 = zoneOffsetMs(new Date(candidate), timeZone);
  if (offset2 !== offset) {
    offset = offset2;
    candidate = guess - offset;
  }
  return new Date(candidate);
}

/** YYYY-MM-DD of `date` in `timeZone`. */
export function zonedYmd(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Add `days` to a YYYY-MM-DD string (calendar arithmetic, zone-free). */
export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Whole days from `a` to `b` (both YYYY-MM-DD). */
export function diffDaysYmd(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by!, bm! - 1, bd!) - Date.UTC(ay!, am! - 1, ad!)) / 86_400_000,
  );
}

/** Weekday (0 = Sunday) of a YYYY-MM-DD string. */
export function weekdayYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

/** Monday (YYYY-MM-DD) of the ISO week containing `ymd`. */
export function weekStartYmd(ymd: string): string {
  const wd = weekdayYmd(ymd);
  const back = wd === 0 ? 6 : wd - 1;
  return addDaysYmd(ymd, -back);
}

/** Serialise a Prisma @db.Date value (UTC midnight) as YYYY-MM-DD. */
export function dbDateToYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Validate an IANA zone name. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
