import { useEffect, useState } from "react";

type Variant = "fullscreen" | "small";

export interface ClockWindow {
  variant: Variant;
  label: string;
  /** Absolute Date we're counting down toward. */
  target: Date;
}

/** Under this many ms remaining, the timer flips red + flashes. */
const WARNING_MS = 5 * 60 * 1000;

/**
 * Map the current local time to a countdown window. The day splits into
 * four repeating segments:
 *   [00:00, 08:00)  →  fullscreen  "DROP BEGINS IN"  → 08:00 today
 *   [08:00, 12:00)  →  small       "VOW CLOSES IN"   → 12:00 today
 *   [12:00, 20:00)  →  small       "DUEL BEGINS IN"  → 20:00 today
 *   [20:00, 24:00)  →  fullscreen  "DROP BEGINS IN"  → 00:00 tomorrow
 *
 * Pure — all state comes from `now`, so both the timer and its host page
 * can derive the same config without having to share state.
 */
export function getClockWindow(now: Date = new Date()): ClockWindow {
  const hour = now.getHours();
  if (hour < 8) {
    return {
      variant: "fullscreen",
      label: "DROP BEGINS IN",
      target: atHourToday(now, 8),
    };
  }
  if (hour < 12) {
    return {
      variant: "small",
      label: "VOW CLOSES IN",
      target: atHourToday(now, 12),
    };
  }
  if (hour < 20) {
    return {
      variant: "small",
      label: "DUEL BEGINS IN",
      target: atHourToday(now, 20),
    };
  }
  // 8 PM → midnight: counts down to the end of "today", then naturally
  // flips into the midnight→8 AM window on the next tick.
  return {
    variant: "fullscreen",
    label: "DROP BEGINS IN",
    target: atNextMidnight(now),
  };
}

function atHourToday(now: Date, hour: number): Date {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function atNextMidnight(now: Date): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Self-driven countdown. Reads the browser clock at 100ms (fullscreen) or
 * 1000ms (small), and re-derives its label / target / variant on every
 * tick so it cycles across phase transitions without any page refresh.
 * Under 5 minutes remaining the digits turn blood-red, a sharp-step flash
 * kicks in, and a pulsing "TIME IS RUNNING OUT." line appears below.
 */
export function CountdownTimer() {
  const [now, setNow] = useState(() => new Date());
  const window = getClockWindow(now);

  useEffect(() => {
    const intervalMs = window.variant === "fullscreen" ? 100 : 1000;
    const id = globalThis.setInterval(() => setNow(new Date()), intervalMs);
    return () => globalThis.clearInterval(id);
  }, [window.variant]);

  const remainingMs = Math.max(0, window.target.getTime() - now.getTime());
  const warning = remainingMs <= WARNING_MS;
  const colorClass = warning ? "text-blood" : "text-gold";
  const flashClass = warning ? "paradox-timer-flash" : "";

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = remainingMs % 1000;

  if (window.variant === "fullscreen") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:py-16">
        <p className="brutal-heading text-sm text-muted md:text-base">
          {window.label}
        </p>

        {/* Dramatic rule above the digits. */}
        <div className="mt-6 h-[2px] w-full max-w-4xl bg-bone" />

        <div
          className={`mt-8 flex items-baseline justify-center gap-1 font-mono font-bold tabular-nums md:mt-10 md:gap-2 ${colorClass} ${flashClass}`}
        >
          <span className="text-[80px] leading-none md:text-[140px] lg:text-[180px]">
            {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
          </span>
          <span className="text-[40px] leading-none md:text-[70px] lg:text-[90px]">
            :{pad3(millis)}
          </span>
        </div>

        <div className="mt-8 h-[2px] w-full max-w-4xl bg-bone md:mt-10" />

        {warning && (
          <p className="brutal-heading mt-6 animate-pulse text-sm text-blood md:text-base">
            TIME IS RUNNING OUT.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 border-b border-smoke px-4 py-4 md:px-6">
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">
        {window.label}
      </p>
      <div
        className={`font-mono font-bold tabular-nums text-xl md:text-2xl ${colorClass} ${flashClass}`}
      >
        {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
      </div>
      {warning && (
        <p className="animate-pulse font-mono text-[10px] uppercase tracking-brutal text-blood md:text-xs">
          TIME IS RUNNING OUT.
        </p>
      )}
    </div>
  );
}
