import { Link } from "react-router-dom";

interface Plan {
  n: string;
  title: string;
  minutes: number;
  grades: string;
  objectives: string[];
  flow: { time: string; step: string }[];
  exit: string;
}

const PLANS: Plan[] = [
  {
    n: "01",
    title: "Reasoning, Not Verdicts",
    minutes: 45,
    grades: "Grades 7–12 · Intro to ethics",
    objectives: [
      "Distinguish a position (what you chose) from a justification (why).",
      "Recognise that people on the same side can reason in very different ways.",
      "Write a single, precise sentence that carries an argument.",
    ],
    flow: [
      { time: "0–5", step: "Project today's paradox. Students vote silently on paper first." },
      { time: "5–15", step: "Students cast their vow in PARADOX: one sentence, no edits." },
      { time: "15–25", step: "Reveal the tribe split. Ask: two people chose A — why did the Oracle sort them differently?" },
      { time: "25–40", step: "Pairs swap sentences and rewrite each other's into a different tribe's reasoning style." },
      { time: "40–45", step: "Exit ticket." },
    ],
    exit: "Write one sentence defending the side you did NOT choose.",
  },
  {
    n: "02",
    title: "Questions Before Arguments",
    minutes: 45,
    grades: "Grades 8–12 · Discussion & debate",
    objectives: [
      "Practise asking clarifying questions before rebutting.",
      "Identify common informal fallacies (straw man, ad hominem, false dichotomy).",
      "Explain what makes a steelman stronger than a straw man.",
    ],
    flow: [
      { time: "0–10", step: "Mini-lesson on the three duel modes and the 12 fallacies the Oracle flags." },
      { time: "10–25", step: "Classroom duels (students are only matched with classmates). Teacher circulates." },
      { time: "25–35", step: "From the Circle dashboard, pull up one anonymised transcript. Find a Red Flag and a Gold Star together." },
      { time: "35–45", step: "Rewrite the Red-Flagged message so it would earn a Gold Star." },
    ],
    exit: "Name one question you asked that changed how you understood your opponent.",
  },
  {
    n: "03",
    title: "Building the Bridge",
    minutes: 50,
    grades: "Grades 9–12 / University · Argument writing",
    objectives: [
      "Locate shared values beneath opposing positions.",
      "Evaluate an AI-drafted synthesis for fairness and accuracy.",
      "Draft a synthesis paragraph both sides could sign.",
    ],
    flow: [
      { time: "0–10", step: "Read three signed Syntheses from the public Archive. What do good ones have in common?" },
      { time: "10–30", step: "Duel, then read the Oracle's draft Synthesis. Sign it, or decline and write down why." },
      { time: "30–45", step: "In the same pairs, hand-write a better Synthesis than the Oracle's." },
      { time: "45–50", step: "Share: did anyone change their mind? Revisit on Throwback Thursday." },
    ],
    exit: "Is it possible to agree on a principle and still disagree on the verdict? Give an example.",
  },
];

/**
 * Printable classroom guide for teachers running PARADOX in a school
 * circle. Print / "Save as PDF" from the browser gives a clean handout.
 */
export function LessonPlansPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10 print:max-w-none print:px-0 print:py-0 md:px-6 md:py-16">
      <header className="border-b-2 border-bone pb-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">FOR TEACHERS</p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">PARADOX IN THE CLASSROOM.</h1>
        <p className="mt-4 font-mono text-bone">
          Three ready-to-run lessons built on the daily dilemma. They support collaborative discussion and
          argument-writing goals (e.g. Common Core ELA SL.1 and W.1). In a school circle, students are only ever
          matched with classmates, their messages are profanity-filtered, and teachers can review every duel.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button onClick={() => window.print()} className="brutal-btn brutal-btn-gold">
            PRINT / SAVE AS PDF
          </button>
          <Link to="/how-to-play" className="brutal-btn">
            HOW THE GAME WORKS
          </Link>
        </div>
      </header>

      {PLANS.map((p) => (
        <section key={p.n} className="break-inside-avoid border-2 border-bone p-5 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-smoke pb-3">
            <h2 className="brutal-heading text-2xl text-bone md:text-3xl">
              <span className="text-gold">{p.n}</span> {p.title.toUpperCase()}
            </h2>
            <span className="font-mono text-xs uppercase tracking-brutal text-muted">
              {p.minutes} MIN · {p.grades}
            </span>
          </div>
          <h3 className="brutal-heading mt-5 text-sm text-gold">OBJECTIVES</h3>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-sm text-bone">
            {p.objectives.map((o) => (
              <li key={o}>· {o}</li>
            ))}
          </ul>
          <h3 className="brutal-heading mt-5 text-sm text-gold">LESSON FLOW</h3>
          <ol className="mt-2 flex flex-col gap-2 font-mono text-sm text-bone">
            {p.flow.map((f) => (
              <li key={f.time} className="flex gap-3">
                <span className="w-14 shrink-0 text-muted">{f.time}</span>
                <span>{f.step}</span>
              </li>
            ))}
          </ol>
          <h3 className="brutal-heading mt-5 text-sm text-gold">EXIT TICKET</h3>
          <p className="mt-2 font-mono text-sm text-bone">{p.exit}</p>
        </section>
      ))}
    </div>
  );
}
