import { useEffect, useState } from "react";
import type { MatchmakingStatus } from "../../../lib/duelTypes.ts";

interface Props {
  status: MatchmakingStatus;
  banner: string | null;
  onJoin: () => void;
  onLeave: () => void;
  /** Duel the AI sparring partner instead of waiting for a human. */
  onSpar: () => void;
}

/**
 * The matchmaking antechamber. Brutalist countdown. The user sees their
 * queue state and a single live action: join, leave, or retry.
 */
export function DuelLobby({ status, banner, onJoin, onLeave, onSpar }: Props) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          PHASE IV · THE DUEL
        </p>
        <h1 className="brutal-heading mt-3 text-4xl leading-tight text-bone md:text-6xl lg:text-7xl lg:leading-none">
          FIND YOUR OPPOSITE.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          Ten minutes. Three combat modes. The Oracle will read every word.
        </p>
      </header>

      {banner && (
        <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{banner}</p>
      )}

      <StatusPanel status={status} onJoin={onJoin} onLeave={onLeave} onSpar={onSpar} />

      <section className="border border-smoke p-6 font-mono text-sm text-muted">
        <p className="brutal-heading text-xs text-gold">HOW IT WORKS</p>
        <ol className="mt-3 space-y-2 text-bone">
          <li>
            <span className="text-gold">0:00 – 3:00</span> · CLARIFICATION — questions only.
            Every message must end with "?".
          </li>
          <li>
            <span className="text-gold">3:00 – 8:00</span> · THE CRUCIBLE — open debate. The
            Oracle flags fallacies in red and strong reasoning in gold.
          </li>
          <li>
            <span className="text-gold">8:00 – 10:00</span> · THE BRIDGE — each side must
            acknowledge one reasonable point made by the other.
          </li>
        </ol>
        <p className="mt-4 text-muted">
          No human opposite around? Spar with the Oracle's partner — an AI from the tribe most
          opposed to yours. Your first spar each day scores at half rate.
        </p>
      </section>
    </div>
  );
}

function SparButton({ onSpar, primary = false }: { onSpar: () => void; primary?: boolean }) {
  return (
    <button onClick={onSpar} className={`brutal-btn ${primary ? "brutal-btn-gold" : ""}`}>
      SPAR WITH THE ORACLE
    </button>
  );
}

function StatusPanel({
  status,
  onJoin,
  onLeave,
  onSpar,
}: {
  status: MatchmakingStatus;
  onJoin: () => void;
  onLeave: () => void;
  onSpar: () => void;
}) {
  if (status.state === "idle") {
    return (
      <div className="brutal-card">
        <p className="brutal-heading text-sm text-muted">READY.</p>
        <p className="mt-2 font-mono text-bone">
          Enter the queue. You'll be matched with someone from an opposing tribe.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={onJoin} className="brutal-btn brutal-btn-gold">
            ENTER THE QUEUE
          </button>
          <SparButton onSpar={onSpar} />
        </div>
      </div>
    );
  }

  if (status.state === "queued") {
    return (
      <QueuedPanel
        since={status.since}
        queueSize={status.queueSize}
        echoChamber={status.echoChamber}
        onLeave={onLeave}
        onSpar={onSpar}
      />
    );
  }

  if (status.state === "matched") {
    return (
      <div className="brutal-card-gold">
        <p className="brutal-heading text-sm text-gold">MATCHED.</p>
        <p className="mt-2 font-mono text-bone">Stand by. The duel room is loading...</p>
      </div>
    );
  }

  if (status.state === "timeout") {
    return (
      <div className="brutal-card-blood">
        <p className="brutal-heading text-sm text-blood">NO HUMAN OPPOSITE FOUND.</p>
        <p className="mt-2 font-mono text-bone">
          The arena is quiet right now. Spar with the Oracle's partner — an AI from the tribe
          most opposed to yours — or try the queue again.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {status.sparAvailable && <SparButton onSpar={onSpar} primary />}
          <button onClick={onJoin} className="brutal-btn">
            TRY THE QUEUE AGAIN
          </button>
        </div>
      </div>
    );
  }

  // ineligible
  return (
    <div className="brutal-card-blood">
      <p className="brutal-heading text-sm text-blood">NOT YET.</p>
      <p className="mt-2 font-mono text-bone">{status.reason}</p>
    </div>
  );
}

function QueuedPanel({
  since,
  queueSize,
  echoChamber,
  onLeave,
  onSpar,
}: {
  since: string;
  queueSize: number;
  echoChamber: boolean;
  onLeave: () => void;
  onSpar: () => void;
}) {
  const [elapsed, setElapsed] = useState(() => Math.max(0, Date.now() - new Date(since).getTime()));

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.max(0, Date.now() - new Date(since).getTime()));
    }, 500);
    return () => clearInterval(t);
  }, [since]);

  const secs = Math.floor(elapsed / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const cardClass = echoChamber ? "brutal-card-blood" : "brutal-card-gold";
  const accentText = echoChamber ? "text-blood" : "text-gold";

  return (
    <div className={cardClass}>
      <p className={`brutal-heading text-sm ${accentText}`}>
        {echoChamber ? "THE ECHO CHAMBER IS SEARCHING..." : "SEARCHING FOR YOUR OPPOSITE..."}
      </p>
      {echoChamber && (
        <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-blood">
          YOUR CIVILITY IS LOW. YOU CAN ONLY MATCH OTHERS WHO HAVE FALLEN.
        </p>
      )}
      <div className="mt-4 font-mono text-5xl text-bone md:text-6xl lg:text-7xl">
        {mm}:{ss}
      </div>
      <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
        {queueSize} IN QUEUE · TIMEOUT IN {Math.max(0, 120 - secs)}S
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={onLeave} className="brutal-btn">
          LEAVE QUEUE
        </button>
        {secs >= 30 && <SparButton onSpar={onSpar} />}
      </div>
    </div>
  );
}
