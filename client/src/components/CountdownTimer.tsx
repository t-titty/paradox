import { useEffect, useState } from "react";

import type { PhaseState } from "../lib/types.ts";

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
 * Map the server's phase to a countdown. The server runs one game clock
 * (PHASE_TIMEZONE) for everyone, so we count down to the instants it gives
 * us rather than to hours on the viewer's own clock.
 *
 *   bridge (overnight) → fullscreen "THE DROP BEGINS IN"
 *   vow                → small      "THE VOW CLOSES IN"
 *   sort               → small      "PRIME-TIME DUELS IN"
 *   duel               → small      "NEXT DROP IN"
 */
export function getClockWindow(phase: PhaseState): ClockWindow {
  switch (phase.phase) {
    case "bridge":
      return { variant: "fullscreen", label: "THE DROP BEGINS IN", target: new Date(phase.nextTransitionAt) };
    case "vow":
    case "drop":
      return { variant: "small", label: "THE VOW CLOSES IN", target: new Date(phase.nextTransitionAt) };
    case "sort":
      return { variant: "small", label: "PRIME-TIME DUELS IN", target: new Date(phase.nextTransitionAt) };
    case "duel":
      return { variant: "small", label: "NEXT DROP IN", target: new Date(phase.nextDropAt) };
  }
}

/** "8:00 AM" — the daily Drop in the viewer's own time zone. */
export function localDropTime(phase: PhaseState): string {
  return new Date(phase.nextDropAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
export function CountdownTimer({
  phase,
  onElapsed,
}: {
  phase: PhaseState;
  /** Called once when the countdown reaches zero (e.g. to refetch the phase). */
  onElapsed?: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const window = getClockWindow(phase);
  const remainingMs = Math.max(0, window.target.getTime() - now.getTime());

  useEffect(() => {
    if (remainingMs > 0 || !onElapsed) return;
    // Small delay so the server's clock has definitely crossed the boundary.
    const t = globalThis.setTimeout(onElapsed, 1500);
    return () => globalThis.clearTimeout(t);
    // Fire once per target, not on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs === 0, window.target.getTime()]);

  useEffect(() => {
    const intervalMs = window.variant === "fullscreen" ? 100 : 1000;
    const id = globalThis.setInterval(() => setNow(new Date()), intervalMs);
    return () => globalThis.clearInterval(id);
  }, [window.variant]);

  const warning = remainingMs <= WARNING_MS;
  const colorClass = warning ? "text-blood" : "text-gold";
  const flashClass = warning ? "paradox-timer-flash" : "";

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = remainingMs % 1000;

  if (window.variant === "fullscreen") {
    // Colons pulse continuously (slow normally, faster when warning).
    // Glow swaps from gold → red in the warning window, and a subtle
    // red inset ring wraps the whole block.
    const glowClass = warning
      ? "paradox-timer-glow-red"
      : "paradox-timer-glow";
    const colonPulseClass = warning
      ? "paradox-colon-pulse-fast"
      : "paradox-colon-pulse";
    const ringClass = warning ? "paradox-timer-warning-ring" : "";

    return (
      <div
        className={`flex flex-1 flex-col items-center justify-center px-4 py-10 md:py-16 ${ringClass}`}
      >
        <p
          className="brutal-heading text-[18px] uppercase text-muted md:text-[22px]"
          style={{ letterSpacing: "0.35em" }}
        >
          {window.label}
        </p>

        {/* Thin gold rule above the digits. */}
        <div className="mt-6 h-px w-full max-w-4xl bg-gold" />

        <div
          className={`mt-8 flex items-baseline justify-center font-mono font-bold tabular-nums md:mt-10 ${colorClass} ${flashClass} ${glowClass}`}
          style={{ letterSpacing: "0.08em" }}
        >
          <span className="text-[72px] leading-none md:text-[120px] lg:text-[160px] xl:text-[200px]">
            {pad2(hours)}
          </span>
          <span
            className={`${colonPulseClass} text-[72px] leading-none md:text-[120px] lg:text-[160px] xl:text-[200px]`}
          >
            :
          </span>
          <span className="text-[72px] leading-none md:text-[120px] lg:text-[160px] xl:text-[200px]">
            {pad2(minutes)}
          </span>
          <span
            className={`${colonPulseClass} text-[72px] leading-none md:text-[120px] lg:text-[160px] xl:text-[200px]`}
          >
            :
          </span>
          <span className="text-[72px] leading-none md:text-[120px] lg:text-[160px] xl:text-[200px]">
            {pad2(seconds)}
          </span>
          <span
            className={`${colonPulseClass} text-[36px] leading-none md:text-[60px] lg:text-[80px] xl:text-[100px]`}
          >
            :
          </span>
          <span className="text-[36px] leading-none md:text-[60px] lg:text-[80px] xl:text-[100px]">
            {pad3(millis)}
          </span>
        </div>

        {/* Thin gold rule below the digits. */}
        <div className="mt-8 h-px w-full max-w-4xl bg-gold md:mt-10" />

        {warning && (
          <p
            className={`brutal-heading mt-6 text-xl text-blood md:text-3xl ${flashClass}`}
            style={{ letterSpacing: "0.35em" }}
          >
            TIME IS RUNNING OUT.
          </p>
        )}
        <p className="mt-6 font-mono text-xs uppercase tracking-brutal text-muted">
          A NEW PARADOX DROPS DAILY AT {localDropTime(phase)} YOUR TIME
        </p>
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
