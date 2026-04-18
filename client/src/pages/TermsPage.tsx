import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">THE RULES</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
          TERMS OF SERVICE.
        </h1>
        <p className="mt-4 font-mono text-sm uppercase tracking-brutal text-muted">
          EFFECTIVE 2026-04-18
        </p>
        <p className="mt-6 font-mono text-base text-bone md:text-lg">
          PARADOX is a forum for thoughtful ethical debate. Not harassment. Not hate. Not noise.
          By creating an account, you agree to the terms below. They are short on purpose.
        </p>
      </header>

      <Section title="1. RESPECTFUL CONDUCT">
        <p>
          Engage with arguments, not people. Disagreement is the point; contempt is not. You may
          push hard on a position — you may not push on the person holding it.
        </p>
        <p>
          The daily Duel gives you 10 minutes to defend a view. Use them well. Bad-faith tactics
          (personal insults, strawmanning, evasion) damage your civility score and can end a duel
          before synthesis.
        </p>
      </Section>

      <Section title="2. NO HATE SPEECH, NO SLURS">
        <p>
          Slurs, bigotry, and dehumanizing language directed at any group — race, ethnicity,
          religion, gender, sexual orientation, disability, or otherwise — are not allowed in
          usernames, justifications, duel transcripts, submissions, or feedback.
        </p>
        <p>
          We use automated filters on usernames and on every written submission. Content that
          clears the filter but still violates this rule may be removed on review.
        </p>
      </Section>

      <Section title="3. NO PERSONAL ATTACKS">
        <p>
          Target the argument, not the opponent. Threats, doxxing, sustained harassment, and
          targeted cruelty are grounds for immediate suspension.
        </p>
        <p>
          This is a philosophy platform. If you would not say it in a seminar room, do not say it
          here.
        </p>
      </Section>

      <Section title="4. CONTENT MODERATION">
        <p>
          We may remove any content — votes, justifications, submissions, feedback, duel messages —
          that violates these terms. We may edit metadata (e.g., redact a slur from an archived
          synthesis) to keep the public record usable.
        </p>
        <p>
          Admins review user-submitted dilemmas before they go live. Not every submission is
          accepted, and that is not personal.
        </p>
      </Section>

      <Section title="5. ACCOUNT SUSPENSION">
        <p>
          Your civility score tracks the tone of your conduct over time. It can fall. It can be
          reset by an admin when justified.
        </p>
        <p>
          Accounts that repeatedly violate these terms may be banned. A banned account cannot log
          in, vote, duel, or submit. We do not owe warnings, but we generally give one.
        </p>
      </Section>

      <Section title="6. DATA USAGE">
        <p>
          We store your username, email, password hash (never the plaintext), and everything you
          write on the platform: votes, justifications, duel transcripts, submissions, feedback.
          Your tribe history and civility score are derived from this.
        </p>
        <p>
          Public data: your username, signed syntheses, and votes that appear in the archive.
          Private data: your email, password hash, and admin-only moderation records.
        </p>
        <p>
          We do not sell your data. We do not run ads against it. We may use aggregated,
          de-identified votes to study reasoning patterns across tribes.
        </p>
      </Section>

      <Section title="7. THOUGHTFUL DEBATE, NOT HARASSMENT">
        <p>
          PARADOX exists so people on opposite sides of hard questions can meet, argue, and sign a
          synthesis neither would have written alone. That is the only thing this platform is for.
        </p>
        <p>
          If you are here to win, humiliate, or recruit — you are in the wrong place.
        </p>
      </Section>

      <footer className="border-t-2 border-smoke pt-6 font-mono text-sm text-muted">
        <p>
          Questions? Use the{" "}
          <Link to="/feedback" className="text-gold hover:text-bone">
            feedback form
          </Link>
          . Changes to these terms will be posted here with an updated effective date.
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-2 border-bone p-5 md:p-6">
      <h2 className="brutal-heading text-xl text-gold md:text-2xl">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 font-mono text-sm text-bone md:text-base">
        {children}
      </div>
    </section>
  );
}
