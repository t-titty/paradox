import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { validateJustification } from "../lib/sentence.ts";
import type { Choice, Paradox, Tribe } from "../lib/types.ts";
import { TRIBE_CREED, TRIBE_LABEL, confidenceLabel } from "../lib/tribes.ts";
import { DuelFlow } from "./views/duel/DuelFlow.tsx";

type Step = "intro" | "vow" | "reveal" | "duel" | "done";

interface PracticeResult {
  choice: Choice;
  tribe: Tribe;
  confidence: number;
  reasoning: string;
}

/**
 * First-run practice round — the "aha" in five minutes, at any hour:
 *   1. what PARADOX is            2. vow on a practice dilemma
 *   3. the Oracle sorts you        4. a 4-minute spar against the AI
 * Nothing here is scored. Skippable at every step.
 */
export function WelcomePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [paradox, setParadox] = useState<Paradox | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);

  useEffect(() => {
    api
      .get<{ paradox: Paradox; vote: { choice: Choice; tribeAssigned: Tribe | null; tribeConfidence: number | null; tribeReasoning: string | null } | null }>(
        "/practice",
      )
      .then(({ data }) => {
        setParadox(data.paradox);
        const v = data.vote;
        if (v?.tribeAssigned && v.tribeReasoning) {
          setResult({
            choice: v.choice,
            tribe: v.tribeAssigned,
            confidence: v.tribeConfidence ?? 0.6,
            reasoning: v.tribeReasoning,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  async function finish() {
    await api.post("/practice/complete").catch(() => undefined);
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-brutal text-muted">
        <span>
          PRACTICE ROUND · STEP {["intro", "vow", "reveal", "duel", "done"].indexOf(step) + 1} OF 5
        </span>
        {step !== "done" && (
          <button onClick={finish} className="underline hover:text-bone">
            SKIP
          </button>
        )}
      </div>

      {step === "intro" && (
        <section className="flex flex-col gap-6">
          <h1 className="brutal-heading text-5xl leading-tight text-bone md:text-7xl">
            ONE DILEMMA.
            <br />
            ONE SENTENCE.
            <br />
            <span className="text-gold">FIND YOUR OPPOSITE.</span>
          </h1>
          <ol className="flex flex-col gap-3 font-mono text-bone">
            <li>
              <span className="text-gold">01 ·</span> Every morning a new moral dilemma drops. You pick a side and
              defend it in exactly one sentence.
            </li>
            <li>
              <span className="text-gold">02 ·</span> The Oracle — an AI referee — reads <em>how</em> you reasoned and
              sorts you into one of seven Moral Tribes.
            </li>
            <li>
              <span className="text-gold">03 ·</span> You duel someone from an opposing tribe for ten minutes. The goal
              isn't to win — it's to find a bridge you can both sign.
            </li>
          </ol>
          <p className="font-mono text-sm text-muted">
            Let's do a quick practice run. Nothing here counts.
          </p>
          <button className="brutal-btn brutal-btn-gold self-start" onClick={() => setStep(result ? "reveal" : "vow")}>
            START THE PRACTICE ROUND →
          </button>
        </section>
      )}

      {step === "vow" && paradox && (
        <PracticeVow
          paradox={paradox}
          onSorted={(r) => {
            setResult(r);
            setStep("reveal");
          }}
        />
      )}

      {step === "reveal" && result && (
        <section className="flex flex-col gap-6">
          <div className="brutal-card-gold">
            <p className="brutal-heading text-sm text-gold">THE ORACLE CALLS YOU</p>
            <h2 className="brutal-heading mt-4 text-4xl text-bone md:text-6xl">{TRIBE_LABEL[result.tribe]}</h2>
            <p className="mt-3 font-mono text-sm italic text-bone">{TRIBE_CREED[result.tribe]}</p>
            <p className="mt-4 font-mono text-xs uppercase tracking-brutal text-muted">
              {confidenceLabel(result.confidence)}
            </p>
            <p className="mt-6 border-t border-smoke pt-4 font-mono text-bone">{result.reasoning}</p>
          </div>
          <p className="font-mono text-bone">
            Notice the Oracle judged your <span className="text-gold">reasoning</span>, not your choice. Now face
            your opposite: a 4-minute practice duel against an AI from the tribe most opposed to yours.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="brutal-btn brutal-btn-gold" onClick={() => setStep("duel")}>
              START THE PRACTICE DUEL →
            </button>
            <button className="brutal-btn" onClick={() => setStep("vow")}>
              TRY A DIFFERENT SENTENCE
            </button>
          </div>
        </section>
      )}

      {step === "duel" && <DuelFlow variant="practice" onPracticeDone={() => setStep("done")} />}

      {step === "done" && (
        <section className="flex flex-col gap-6">
          <h1 className="brutal-heading text-5xl text-bone md:text-6xl">YOU'RE READY.</h1>
          <ul className="flex flex-col gap-2 font-mono text-bone">
            <li>· Vow every day to build a streak 🔥</li>
            <li>· Gold Stars for strong moves earn Wisdom Points; fallacies cost them</li>
            <li>· Personal attacks are redacted before your opponent sees them — and cost Civility</li>
            <li>· No human around? You can always spar with the AI</li>
          </ul>
          <button className="brutal-btn brutal-btn-gold self-start" onClick={finish}>
            GO TO TODAY'S PARADOX →
          </button>
        </section>
      )}
    </div>
  );
}

function PracticeVow({ paradox, onSorted }: { paradox: Paradox; onSorted: (r: PracticeResult) => void }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const check = validateJustification(text);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!choice || !check.valid) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<PracticeResult>("/practice/vote", { choice, justification: text.trim() });
      onSorted(data);
    } catch (err) {
      setError(errorMessage(err, "The Oracle could not read you. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-brutal text-gold">PRACTICE DILEMMA</p>
      <h1 className="brutal-heading text-4xl text-bone md:text-6xl">{paradox.title.toUpperCase()}</h1>
      <p className="font-mono text-bone md:text-lg">{paradox.description}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(["A", "B"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChoice(c)}
            className={`border-2 p-5 text-left font-mono ${
              choice === c ? "border-gold bg-gold text-ink" : "border-bone text-bone hover:border-gold"
            }`}
          >
            <div className="brutal-heading text-4xl">{c}</div>
            <div className="mt-2">{c === "A" ? paradox.optionA : paradox.optionB}</div>
          </button>
        ))}
      </div>
      <div>
        <label className="brutal-heading text-sm text-muted">WHY? ONE SENTENCE.</label>
        <textarea
          className="brutal-input mt-2 min-h-[100px] resize-none"
          placeholder="e.g. Everyone deserves the same chance to live, so the only fair answer is a lottery."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <p className={`mt-2 font-mono text-xs ${check.valid ? "text-gold" : "text-muted"}`}>
          {check.valid ? "✓ ONE SENTENCE" : check.reason ?? " "}
        </p>
      </div>
      {error && <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>}
      <button className="brutal-btn brutal-btn-gold self-start" disabled={!choice || !check.valid || busy}>
        {busy ? "THE ORACLE READS..." : "LET THE ORACLE READ ME"}
      </button>
    </form>
  );
}
