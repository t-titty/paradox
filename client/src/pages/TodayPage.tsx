import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import type { Phase, TodayResponse } from "../lib/types.ts";
import { PhaseBanner } from "../components/PhaseBanner.tsx";
import { CountdownTimer } from "../components/CountdownTimer.tsx";
import { HighlightsPanel } from "../components/HighlightsPanel.tsx";
import { StreakChip } from "../components/StreakChip.tsx";
import { DropVow } from "./views/DropVow.tsx";
import { SortView } from "./views/SortView.tsx";
import { DuelFlow } from "./views/duel/DuelFlow.tsx";
import { Throwback } from "./views/Throwback.tsx";

/**
 * The single daily entry point. The server decides the phase on the shared
 * game clock; this page only renders it.
 *
 *   bridge (overnight)  → fullscreen countdown to the Drop + last night's highlights
 *   vow                 → the dilemma and the vow form (or Throwback on Thursdays)
 *   sort / duel         → not voted yet: a late vow · voted: RESULTS and ARENA tabs
 *
 * The arena stays mounted while you look at your results, so a match that
 * lands while you're reading switches you straight into the duel.
 */
export function TodayPage() {
  const [state, setState] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseOverride, setPhaseOverride] = useState<Phase | null>(null);
  // While a duel is live, the duel room gets the whole screen.
  const [inDuel, setInDuel] = useState(false);

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

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6 md:p-16">
        <div className="brutal-card-blood">
          <p className="brutal-heading text-2xl text-blood">THE ORACLE IS SILENT</p>
          <p className="mt-3 font-mono text-bone">{error}</p>
          <button onClick={() => load()} className="brutal-btn mt-6">
            TRY AGAIN
          </button>
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

  const phase = state.phase;
  const testMode = phase.testMode;
  const banner = (
    <PhaseBanner
      phase={phase.phase}
      nextTransitionAt={phase.nextTransitionAt}
      testMode={testMode}
      onPhaseOverride={setPhaseOverride}
      clockOverridden={phase.clockOverridden}
    />
  );
  // When the countdown hits zero the phase has changed — refetch.
  const countdown = <CountdownTimer phase={phase} onElapsed={() => load()} />;

  // Overnight: the countdown owns the page, with last night's highlights below.
  if (phase.phase === "bridge") {
    return (
      <div className="flex flex-1 flex-col">
        {banner}
        {countdown}
        {state.mode === "daily" && (
          <div className="flex justify-center pb-8">
            <StreakChip streak={state.streak} />
          </div>
        )}
        <HighlightsPanel />
      </div>
    );
  }

  if (state.mode === "throwback") {
    return (
      <div className="flex flex-col">
        {banner}
        {countdown}
        <Throwback state={state} onDone={() => load()} />
      </div>
    );
  }

  const { paradox, hasVoted, lateVowGrant, globalLateVowActive, lateVowOpen } = state;
  const hasGrant = (Boolean(lateVowGrant) || globalLateVowActive) && !hasVoted;
  const showVowForm = phase.phase === "vow" || phase.phase === "drop" || (!hasVoted && (lateVowOpen || hasGrant));

  return (
    <div className="flex flex-col">
      {!inDuel && banner}
      {!inDuel && countdown}
      {!inDuel && state.needsOnboarding && <OnboardingNudge />}
      {showVowForm ? (
        <>
          {phase.phase !== "vow" && !hasVoted && <LateVowBanner />}
          <div className="mx-auto w-full max-w-4xl px-4 pt-6 md:px-6">
            <StreakChip streak={state.streak} />
          </div>
          <DropVow
            paradox={paradox}
            hasVoted={hasVoted}
            vote={state.vote}
            onVoted={() => load()}
            testMode={testMode}
            onSortNow={() => setPhaseOverride("sort")}
            number={state.paradoxNumber}
            late={phase.phase !== "vow" && !hasVoted}
          />
        </>
      ) : hasVoted && state.duelsOpen ? (
        <ResultsAndArena defaultTab={phase.phase === "duel" ? "arena" : "results"} onInDuel={setInDuel} />
      ) : (
        <Placeholder
          roman="III"
          title="THE VOW HAS CLOSED"
          body="Come back at the next Drop to take a side."
        />
      )}
    </div>
  );
}

function ResultsAndArena({
  defaultTab,
  onInDuel,
}: {
  defaultTab: "results" | "arena";
  onInDuel: (active: boolean) => void;
}) {
  const [tab, setTab] = useState<"results" | "arena">(defaultTab);
  const [inDuel, setInDuel] = useState(false);

  return (
    <div className="flex flex-col">
      {!inDuel && (
        <div className="flex border-b border-smoke font-mono text-xs uppercase tracking-brutal">
          <TabButton active={tab === "results"} onClick={() => setTab("results")}>
            YOUR TRIBE & RESULTS
          </TabButton>
          <TabButton active={tab === "arena"} onClick={() => setTab("arena")}>
            THE ARENA ⚔
          </TabButton>
        </div>
      )}
      <div className={tab === "results" && !inDuel ? "" : "hidden"}>
        <SortView />
      </div>
      {/* Always mounted so matchmaking events are never missed. */}
      <div className={tab === "arena" || inDuel ? "" : "hidden"}>
        <DuelFlow
          onActiveChange={(active) => {
            setInDuel(active);
            onInDuel(active);
            if (active) setTab("arena");
          }}
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-4 ${active ? "border-b-2 border-gold text-gold" : "text-muted hover:text-bone"}`}
    >
      {children}
    </button>
  );
}

function OnboardingNudge() {
  return (
    <div className="border-b-2 border-gold bg-ash px-4 py-3 text-center font-mono text-xs uppercase tracking-brutal text-bone md:px-6 md:text-sm">
      NEW HERE?{" "}
      <Link to="/welcome" className="text-gold underline">
        TAKE THE 3-MINUTE PRACTICE ROUND →
      </Link>
    </div>
  );
}

function LateVowBanner() {
  return (
    <div className="border-b-2 border-gold bg-ink px-4 py-3 text-center font-mono text-xs uppercase tracking-brutal text-gold md:px-6 md:text-sm">
      MISSED THE VOW WINDOW? YOU CAN STILL TAKE A SIDE UNTIL MIDNIGHT — AND STILL DUEL.
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
