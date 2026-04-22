import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.ts";
import type { Phase, TodayResponse } from "../lib/types.ts";
import { PhaseBanner } from "../components/PhaseBanner.tsx";
import { CountdownTimer } from "../components/CountdownTimer.tsx";
import { DropVow } from "./views/DropVow.tsx";
import { SortView } from "./views/SortView.tsx";
import { DuelFlow } from "./views/duel/DuelFlow.tsx";
import { Throwback } from "./views/Throwback.tsx";

/**
 * Label shown above the countdown digits for each phase. Drop and Bridge
 * both count to the next 8 AM drop, so they share the same label.
 */
function countdownLabelFor(phase: Phase): string {
  switch (phase) {
    case "bridge":
      return "NEXT DROP IN";
    case "drop":
    case "vow":
      return "VOW CLOSES IN";
    case "sort":
      return "DUEL BEGINS IN";
    case "duel":
      return "DUEL ENDS IN";
  }
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

  if (state.mode === "throwback") {
    return (
      <div className="flex flex-col">
        <PhaseBanner
          phase={state.phase.phase}
          nextTransitionAt={state.phase.nextTransitionAt}
          testMode={testMode}
          onPhaseOverride={onPhaseOverride}
        />
        <CountdownTimer
          targetAt={state.phase.nextTransitionAt}
          variant="small"
          label={countdownLabelFor(state.phase.phase)}
        />
        <Throwback state={state} onDone={() => load()} />
      </div>
    );
  }

  const { phase, paradox, hasVoted } = state;
  const countdownLabel = countdownLabelFor(phase.phase);

  // Bridge = "waiting for next Drop". Takes over the page with a dramatic
  // fullscreen timer; PhaseBanner stays so test-mode admins can switch
  // phases and still see the test-mode ribbon.
  if (phase.phase === "bridge") {
    return (
      <div className="flex flex-1 flex-col">
        <PhaseBanner
          phase={phase.phase}
          nextTransitionAt={phase.nextTransitionAt}
          testMode={testMode}
          onPhaseOverride={onPhaseOverride}
        />
        <CountdownTimer
          targetAt={phase.nextTransitionAt}
          variant="fullscreen"
          label={countdownLabel}
          showMillis
        />
      </div>
    );
  }

  // Active phase (drop / vow / sort / duel). Small or medium timer sits
  // directly below the phase banner, on top of the phase-specific view.
  const timerVariant = phase.phase === "duel" ? "medium" : "small";

  return (
    <div className="flex flex-col">
      <PhaseBanner
        phase={phase.phase}
        nextTransitionAt={phase.nextTransitionAt}
        testMode={testMode}
        onPhaseOverride={onPhaseOverride}
      />
      <CountdownTimer
        targetAt={phase.nextTransitionAt}
        variant={timerVariant}
        label={countdownLabel}
      />
      {phase.phase === "vow" && (
        <DropVow
          paradox={paradox}
          hasVoted={hasVoted}
          vote={state.vote}
          onVoted={() => load()}
          testMode={testMode}
          onSortNow={() => setPhaseOverride("sort")}
        />
      )}
      {phase.phase === "sort" && <SortView />}
      {phase.phase === "duel" && <DuelFlow />}
      {phase.phase === "drop" && (
        <Placeholder
          roman="I"
          title="THE DROP"
          body="The paradox has been revealed. Switch to THE VOW to take a side."
        />
      )}
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
