import { useEffect, useMemo, useState } from "react";

type Variant = "fullscreen" | "medium" | "small";

interface Props {
  /** ISO string — the moment we're counting down to (server's nextTransitionAt). */
  targetAt: string;
  /** Sizes the timer. fullscreen fills the viewport; medium/small sit below the phase banner. */
  variant: Variant;
  /** Label above the digits, e.g. "NEXT DROP IN". Rendered uppercase. */
  label: string;
  /** If true the fullscreen variant shows a :MS column and polls at 10ms. */
  showMillis?: boolean;
}

/** Under this many ms remaining, the timer flips red + flashes. */
const WARNING_MS = 5 * 60 * 1000;

function computeRemaining(targetMs: number, nowMs: number) {
  const ms = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(ms / 1000);
  return {
    ms,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    millis: ms % 1000,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Phase-aware countdown timer for the TodayPage.
 *
 * The fullscreen variant dominates the page during waiting states (bridge
 * before Drop, bridge after Duel). The medium / small variants sit below
 * the PhaseBanner during active phases (vow / sort / duel).
 *
 * When <=5 minutes remain the digits turn blood-red, the flash animation
 * kicks in, and a pulsing "TIME IS RUNNING OUT." line appears below.
 * Poll cadence is 10ms when `showMillis` is true (fullscreen with MS
 * column), 1000ms otherwise.
 */
export function CountdownTimer({ targetAt, variant, label, showMillis }: Props) {
  const targetMs = useMemo(() => new Date(targetAt).getTime(), [targetAt]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalMs = showMillis ? 10 : 1000;
    const id = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [showMillis]);

  const { ms, hours, minutes, seconds, millis } = computeRemaining(targetMs, nowMs);
  const warning = ms <= WARNING_MS;
  const colorClass = warning ? "text-blood" : "text-gold";
  const flashClass = warning ? "paradox-timer-flash" : "";

  if (variant === "fullscreen") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 md:py-16">
        <p className="brutal-heading text-sm text-muted md:text-base">{label}</p>

        {/* Dramatic single horizontal line above the digits. */}
        <div className="mt-6 h-[2px] w-full max-w-4xl bg-bone" />

        <div
          className={`mt-8 flex items-baseline justify-center gap-1 font-mono font-bold tabular-nums md:mt-10 md:gap-2 ${colorClass} ${flashClass}`}
        >
          <span className="text-[80px] leading-none md:text-[140px] lg:text-[180px]">
            {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}
          </span>
          {showMillis && (
            <span className="text-[40px] leading-none md:text-[70px] lg:text-[90px]">
              :{pad3(millis)}
            </span>
          )}
        </div>

        {/* ...and below the digits. */}
        <div className="mt-8 h-[2px] w-full max-w-4xl bg-bone md:mt-10" />

        {warning && (
          <p className="brutal-heading mt-6 animate-pulse text-sm text-blood md:text-base">
            TIME IS RUNNING OUT.
          </p>
        )}
      </div>
    );
  }

  // Medium and small variants share the same structure; only the digit
  // size changes.
  const digitSize =
    variant === "medium" ? "text-3xl md:text-5xl" : "text-xl md:text-2xl";

  return (
    <div className="flex flex-col items-center gap-2 border-b border-smoke px-4 py-4 md:px-6">
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">
        {label}
      </p>
      <div
        className={`font-mono font-bold tabular-nums ${digitSize} ${colorClass} ${flashClass}`}
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
