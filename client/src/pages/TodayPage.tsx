import { useEffect, useState } from "react";
import { api, errorMessage } from "../lib/api.ts";
import type { Phase, TodayResponse } from "../lib/types.ts";
import { PhaseBanner } from "../components/PhaseBanner.tsx";
import { DropVow } from "./views/DropVow.tsx";
import { SortView } from "./views/SortView.tsx";
import { DuelFlow } from "./views/duel/DuelFlow.tsx";
import { Throwback } from "./views/Throwback.tsx";

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
        <Throwback state={state} onDone={() => load()} />
      </div>
    );
  }

  const { phase, paradox, hasVoted } = state;

  return (
    <div className="flex flex-col">
      <PhaseBanner
        phase={phase.phase}
        nextTransitionAt={phase.nextTransitionAt}
        testMode={testMode}
        onPhaseOverride={onPhaseOverride}
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
      {phase.phase === "bridge" && (
        <Placeholder
          roman="V"
          title="THE BRIDGE"
          body="Between duels, the world sleeps. The next Drop arrives at 8:00 AM."
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
