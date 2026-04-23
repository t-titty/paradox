import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.ts";
import type { Phase, TodayResponse } from "../lib/types.ts";
import { PhaseBanner } from "../components/PhaseBanner.tsx";
import { CountdownTimer, getClockWindow } from "../components/CountdownTimer.tsx";
import { DropVow } from "./views/DropVow.tsx";
import { SortView } from "./views/SortView.tsx";
import { DuelFlow } from "./views/duel/DuelFlow.tsx";
import { Throwback } from "./views/Throwback.tsx";

/**
 * Track which clock window we're in so the page can swap between the
 * fullscreen-takeover layout (00:00–08:00 and 20:00–24:00) and the
 * inline small-timer layout (08:00–20:00). We re-poll at 15s — the
 * window only changes on the hour boundaries 00/08/12/20, so 15s is
 * generous without being wasteful.
 */
function useClockVariant(): "fullscreen" | "small" {
  const [variant, setVariant] = useState(() => getClockWindow().variant);
  useEffect(() => {
    const id = window.setInterval(
      () => setVariant(getClockWindow().variant),
      15_000,
    );
    return () => window.clearInterval(id);
  }, []);
  return variant;
}

/**
 * The single daily entry point. Resolves the current phase server-side,
 * then mounts the correct sub-view. On eligible Thursdays, the server
 * returns a throwback payload instead of the daily paradox.
 *
 * In test mode, we hold a local phase override and pass it to the server
 * so all gated logic (paradox route, banner, sub-view) stays in sync.
 */
export function TodayPage() {
  const [state, setState] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseOverride, setPhaseOverride] = useState<Phase | null>(null);
  const clockVariant = useClockVariant();

  async function load(override: Phase | null = phaseOverride) {
    try {
      const { data } = await api.get<TodayResponse>("/paradox/today", {
        params: override ? { phase: override } : {},
      });
      setState(data);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Failed to load today's paradox."));
    }
  }

  useEffect(() => {
    load(phaseOverride);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseOverride]);

  function onPhaseOverride(p: Phase) {
    setPhaseOverride(p);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-16">
        <div className="brutal-card-blood">
          <p className="brutal-heading text-2xl text-blood">THE ORACLE IS SILENT</p>
          <p className="mt-3 font-mono text-bone">{error}</p>
          <p className="mt-3 font-mono text-sm text-muted">
            If the server has no paradox for today, run{" "}
            <code className="text-gold">npm run db:seed</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center p-16">
        <p className="brutal-heading text-xl text-muted">LISTENING...</p>
      </div>
    );
  }

  const testMode = state.phase.testMode;

  // During the two fullscreen windows (00:00–08:00 and 20:00–24:00) the
  // countdown owns the page — phase content is hidden because the user
  // is either pre-drop or past the duel window. PhaseBanner stays at the
  // top so test-mode admins can still switch phases.
  if (clockVariant === "fullscreen") {
    return (
      <div className="flex flex-1 flex-col">
        <PhaseBanner
          phase={state.phase.phase}
          nextTransitionAt={state.phase.nextTransitionAt}
          testMode={testMode}
          onPhaseOverride={onPhaseOverride}
        />
        <CountdownTimer />
      </div>
    );
  }

  // Small-timer windows (08:00–20:00): throwback renders during vow hours,
  // otherwise fall through to the daily flow.
  if (state.mode === "throwback") {
    return (
      <div className="flex flex-col">
        <PhaseBanner
          phase={state.phase.phase}
          nextTransitionAt={state.phase.nextTransitionAt}
          testMode={testMode}
          onPhaseOverride={onPhaseOverride}
        />
        <CountdownTimer />
        <Throwback state={state} onDone={() => load()} />
      </div>
    );
  }

  const { phase, paradox, hasVoted, lateVowGrant, globalLateVowActive } = state;
  // An unused grant — individual OR global — lets the user vote even if
  // the vow window has closed. Either way we show the voting UI.
  const hasIndividualGrant = Boolean(lateVowGrant);
  const canVowLate = (hasIndividualGrant || globalLateVowActive) && !hasVoted;

  return (
    <div className="flex flex-col">
      <PhaseBanner
        phase={phase.phase}
        nextTransitionAt={phase.nextTransitionAt}
        testMode={testMode}
        onPhaseOverride={onPhaseOverride}
      />
      <CountdownTimer />
      {canVowLate && (
        <LateVowBanner scope={hasIndividualGrant ? "individual" : "global"} />
      )}
      {(phase.phase === "vow" || canVowLate) && (
        <DropVow
          paradox={paradox}
          hasVoted={hasVoted}
          vote={state.vote}
          onVoted={() => load()}
          testMode={testMode}
          onSortNow={() => setPhaseOverride("sort")}
        />
      )}
      {!canVowLate && phase.phase === "sort" && <SortView />}
      {!canVowLate && phase.phase === "duel" && <DuelFlow />}
      {!canVowLate && phase.phase === "drop" && (
        <Placeholder
          roman="I"
          title="THE DROP"
          body="The paradox has been revealed. Switch to THE VOW to take a side."
        />
      )}
    </div>
  );
}

function LateVowBanner({ scope }: { scope: "individual" | "global" }) {
  const msg =
    scope === "global"
      ? "Late vow access is open for today's paradox. Cast your vow now."
      : "You have been granted late vow access for today's paradox. Cast your vow before midnight.";
  return (
    <div className="border-b-2 border-gold bg-ink px-4 py-3 text-center font-mono text-xs uppercase tracking-brutal text-gold md:px-6 md:text-sm">
      {msg}
    </div>
  );
}

function Placeholder({ roman, title, body }: { roman: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:p-16">
      <p className="font-mono text-sm uppercase tracking-brutal text-muted">PHASE {roman}</p>
      <h1 className="brutal-heading mt-2 text-4xl text-bone md:text-6xl">{title}</h1>
      <p className="mt-6 font-mono text-bone">{body}</p>
    </div>
  );
}
