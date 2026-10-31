import { Link } from "react-router-dom";

export function HowToPlayPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 md:px-6 md:py-16">
      <header className="border-b-2 border-bone pb-8">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          FIELD MANUAL // V.1
        </p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl lg:text-8xl">
          HOW TO PLAY.
        </h1>
        <p className="mt-6 font-mono text-base text-bone md:text-lg">
          Read once. Argue forever.
        </p>
      </header>

      {/* 1. OVERVIEW */}
      <Section number="01" title="THE OVERVIEW">
        <p>
          <Gold>PARADOX</Gold> is a daily ethical debate game. Every morning a new dilemma
          drops. You vote, defend your position in one sentence, and are sorted into one
          of seven <Gold>Moral Tribes</Gold> based on the reasoning behind your vote — not
          the vote itself.
        </p>
        <p>
          Once the Vow closes, the arena opens: you are matched against someone from an
          opposing tribe for a 10-minute live duel (prime time is the evening bell). No
          human around? Spar with the Oracle's partner instead. You argue. You listen. You
          either walk away, or sign a <Gold>Synthesis</Gold> — a statement neither of you
          would have written alone.
        </p>
        <p className="font-mono text-sm text-muted">
          Everyone plays on one shared game clock. The Today page shows every phase in your
          own time zone.
        </p>
        <p className="border-l-2 border-gold pl-4 text-gold">
          Your reasoning defines you, not your score.
        </p>
      </Section>

      {/* 2. FIVE PHASES */}
      <Section number="02" title="THE FIVE PHASES">
        <p className="font-mono text-sm uppercase tracking-brutal text-muted">
          A PARADOX DAY, FROM DROP TO BRIDGE.
        </p>

        <Phase
          roman="I"
          name="THE DROP"
          time="08:00"
          body="The daily dilemma appears. One question, two hard answers. No warm-up, no tutorial. Read carefully — you will defend whatever you pick."
        />

        <Phase
          roman="II"
          name="THE VOW"
          time="08:00 — NOON"
          body="Vote, then write your one-sentence justification. The sentence is the game. Once you submit, it is locked — no editing, no takebacks. Miss the window? You can still cast a late vow until midnight and you'll be sorted on the spot."
        />

        <Phase
          roman="III"
          name="THE SORT"
          time="NOON"
          body="The Oracle AI reads every justification and assigns each voter to a Moral Tribe. Two players with identical votes can end up in different tribes if their reasoning differs. The sentence, not the click, decides. Results — and how each tribe split — are revealed the moment the Vow closes."
        />

        <Phase
          roman="IV"
          name="THE DUEL"
          time="NOON — MIDNIGHT · PRIME TIME 20:00"
          body="Matchmaking pairs you with an opponent from an opposing tribe for ten minutes. If nobody turns up within two minutes, you can spar with an AI from the tribe most opposed to yours (your first spar each day scores at half rate). The duel runs in three combat modes:"
          modes={[
            {
              label: "CLARIFICATION",
              range: "0:00 — 3:00",
              body: "Questions only. No claims, no counterarguments. Understand before you attack.",
            },
            {
              label: "CRUCIBLE",
              range: "3:00 — 8:00",
              body: "Open argument. Press, defend, expose fallacies. The Oracle is watching.",
            },
            {
              label: "BRIDGE WINDOW",
              range: "8:00 — 10:00",
              body: "Acknowledge the most reasonable point your opponent made, in your own words. Each acknowledgement earns the other side Wisdom Points. Skip it and you lose Civility.",
            },
          ]}
        />

        <Phase
          roman="V"
          name="THE BRIDGE"
          time="POST-DUEL"
          body="The clock stops. You can keep talking in an untimed chat, or read the Synthesis the Oracle has drafted from the duel and sign it. Signing is public and permanent. Walking is allowed — but the transcript is still archived."
        />
      </Section>

      {/* 3. THE SEVEN TRIBES */}
      <Section number="03" title="THE MORAL TRIBES">
        <p>
          Seven schools of ethical thought. You are assigned to whichever one best matches
          the <Gold>shape of your reasoning</Gold>, not the side you chose.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Tribe
            name="UTILITARIAN"
            body="The right act maximizes total well-being. Outcomes are the scoreboard."
          />
          <Tribe
            name="DEONTOLOGIST"
            body="Some acts are wrong regardless of outcome. Duties and rights are non-negotiable."
          />
          <Tribe
            name="VIRTUE ETHICIST"
            body="Ask what a person of good character would do. The actor matters more than the act."
          />
          <Tribe
            name="NIHILIST"
            body="Moral claims have no objective ground. All values are constructed — argue anyway."
          />
          <Tribe
            name="STOIC"
            body="Focus on what is in your control. Right action flows from reason, not passion."
          />
          <Tribe
            name="EXISTENTIALIST"
            body="Meaning is made through choice. You are responsible for the values you commit to."
          />
          <Tribe
            name="HEDONIST"
            body="Pleasure is the good, pain is the bad. Pick the life that feels worth living."
          />
        </div>
      </Section>

      {/* 4. THE ORACLE */}
      <Section number="04" title="THE ORACLE">
        <p>
          The Oracle is the AI referee. It never picks a side. It watches for the shape of
          your reasoning and marks it in real time.
        </p>
        <Rule
          label="TRIBE SORTING"
          body="Reads your justification sentence and places you in the Moral Tribe that best fits your reasoning style."
        />
        <Rule
          label="RED FLAGS"
          body="Flags logical fallacies — straw man, false dichotomy, slippery slope, whataboutism and more — in the Crucible. Each Red Flag costs 2 Wisdom Points (up to five per duel)."
          color="blood"
        />
        <Rule
          label="GOLD STARS"
          body="Marks strong moves in the Crucible: clean steelmanning, precise distinctions, conceding a point gracefully. Each Gold Star earns 3 Wisdom Points (up to five per duel)."
          color="gold"
        />
        <Rule
          label="AD HOMINEM REDACTION"
          body="Every message is checked before your opponent sees it. Personal attacks are redacted — the opponent only ever sees a redaction mark — and cost 10 Civility each."
        />
        <Rule
          label="SYNTHESIS"
          body="At the end of the duel, the Oracle drafts a short statement capturing the common ground you reached. Both players may sign. Signed syntheses enter the Global Archive."
          color="gold"
        />
      </Section>

      {/* 5. WP + CIVILITY */}
      <Section number="05" title="WISDOM POINTS & CIVILITY SCORE">
        <Stat
          label="WISDOM POINTS"
          shorthand="WP"
          body="Earned from Gold Stars, finishing duels, having your points acknowledged, finishing a duel without a Red Flag, and co-signing a Synthesis. WP raises your title — Initiate, Sophist, Dialectician, Philosopher, Sage, Oracle-Touched — and buys streak freezes."
          color="gold"
        />
        <Stat
          label="CIVILITY SCORE"
          shorthand="CIV 0–100"
          body="A rolling measure of how you treat opponents. Ad hominem attempts, sustained hostility, rage-quitting a duel, and repeat Red Flags deduct from it. Clean conduct restores it slowly."
        />
        <div className="border-2 border-blood p-5 md:p-6">
          <p className="brutal-heading text-lg text-blood md:text-xl">THE ECHO CHAMBER</p>
          <p className="mt-3 font-mono text-sm text-bone md:text-base">
            Civility below <Gold>40</Gold> sends you to the Echo Chamber: you can still
            read and vote, but you are matched only against other low-civility players
            until your score recovers. It is not a ban. It is a mirror.
          </p>
        </div>
      </Section>

      {/* 6. MORAL CONSTELLATION */}
      <Section number="06" title="THE MORAL CONSTELLATION">
        <p>
          Your profile holds a 3D chart of every justification you have ever written. Each
          dot is a day. The cluster is your <Gold>moral fingerprint</Gold>.
        </p>
        <p className="font-mono text-sm uppercase tracking-brutal text-muted">
          THE THREE AXES.
        </p>
        <Axis
          label="X — DEONTOLOGY ↔ CONSEQUENTIALISM"
          body="Do you reason from rules and duties, or from consequences? Deontologists sit at one end, utilitarians at the other."
        />
        <Axis
          label="Y — INDIVIDUALISM ↔ COLLECTIVISM"
          body="Does your reasoning centre the individual or the group? Existentialists and hedonists lean individual; utilitarians lean collective."
        />
        <Axis
          label="Z — EMOTIONAL ↔ RATIONAL"
          body="Does your reasoning run on felt experience or on cool argument? Hedonists and existentialists lean emotional; stoics lean rational."
        />
        <p>
          Over time the cluster moves. That motion is the game — watch yourself think.
        </p>
      </Section>

      {/* 7. THROWBACK THURSDAY */}
      <Section number="07" title="THROWBACK THURSDAY">
        <p>
          On Thursdays, if you answered a Thursday dilemma at least four weeks ago,
          PARADOX resurfaces it instead of a fresh one. You vote again, write a new
          justification, and see both sentences side by side — marked as shifted, held,
          or evolved.
        </p>
        <p className="border-l-2 border-gold pl-4 text-bone">
          Did you flip your vote? Did your reasoning sharpen? Did the tribe you landed in
          last time still fit?
        </p>
        <p>
          Flip your vote and you earn the CHANGED MY MIND badge.
        </p>
      </Section>

      {/* STREAKS, TITLES, TRIBE WARS */}
      <Section number="★" title="STREAKS, TITLES & TRIBE WARS">
        <p>
          Vow every day to build a <Gold>streak</Gold>. Miss a day and it resets — unless you
          hold a <Gold>streak freeze</Gold> (50 WP each, up to three), which is spent
          automatically to cover the gap the next time you vow.
        </p>
        <p>
          Every week the tribes compete in <Link to="/tribe-wars" className="text-gold hover:text-bone">Tribe Wars</Link>:
          Gold Stars and signed Syntheses score points, Red Flags lose them, and scores are
          per member so the biggest tribe doesn't win by size.
        </p>
        <p>
          Share your result after the Sort — your tribe, how many people sided with you, and
          your streak, as a card your friends can tap straight into.
        </p>
      </Section>

      {/* 8. GLOBAL ARCHIVE */}
      <Section number="08" title="THE GLOBAL ARCHIVE">
        <p>
          Every Synthesis signed by two human opponents becomes permanent public record
          (spars with the AI stay private). Browse the{" "}
          <Link to="/archive" className="text-gold hover:text-bone">
            Archive
          </Link>{" "}
          to read syntheses from past duels — each one a paragraph that two opposing
          tribes could both put their names on.
        </p>
        <p>
          Your signed syntheses are attached to your profile forever. You cannot delete
          them. Sign what you mean.
        </p>
      </Section>

      {/* 9. TIPS FOR NEW PLAYERS */}
      <Section number="09" title="TIPS FOR NEW PLAYERS">
        <Tip
          n="01"
          body="Your justification determines your tribe more than your vote. Two Yeses with different reasoning land in different tribes — write like it matters."
        />
        <Tip
          n="02"
          body="In Clarification mode you can only ask questions. Use them. The best debaters spend the first three minutes understanding the opponent they are about to face."
        />
        <Tip
          n="03"
          body="Steelman before you strike. Stating your opponent's view better than they did is the single fastest way to earn a Gold Star — and it disarms them."
        />
        <Tip
          n="04"
          body="Ad hominem is not just punished, it is invisible. If you are reaching for insults, the Oracle will grey them out and your opponent will never see them. Spend the energy on the argument instead."
        />
        <Tip
          n="05"
          body="Signing a Synthesis is not losing. Walking away from a bad one is not winning. The Archive remembers which one you did."
        />
      </Section>

      <footer className="border-t-2 border-smoke pt-6 font-mono text-sm text-muted">
        <p>
          Ready?{" "}
          <Link to="/" className="text-gold hover:text-bone">
            GO TO TODAY
          </Link>
          . The clock is already running.
        </p>
      </footer>
    </div>
  );
}

/* ---------- section primitives ---------- */

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-2 border-bone p-5 md:p-8">
      <div className="flex items-baseline gap-4 border-b-2 border-smoke pb-4">
        <span className="brutal-heading text-2xl text-gold md:text-4xl">{number}</span>
        <h2 className="brutal-heading text-2xl text-bone md:text-4xl">{title}</h2>
      </div>
      <div className="mt-6 flex flex-col gap-4 font-mono text-sm text-bone md:text-base">
        {children}
      </div>
    </section>
  );
}

function Phase({
  roman,
  name,
  time,
  body,
  modes,
}: {
  roman: string;
  name: string;
  time: string;
  body: string;
  modes?: { label: string; range: string; body: string }[];
}) {
  return (
    <div className="border-2 border-smoke p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-smoke pb-2">
        <div className="flex items-baseline gap-3">
          <span className="brutal-heading text-xl text-gold md:text-2xl">
            PHASE {roman}
          </span>
          <span className="brutal-heading text-xl text-bone md:text-2xl">{name}</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-brutal text-muted md:text-sm">
          {time}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm text-bone md:text-base">{body}</p>
      {modes && (
        <div className="mt-4 flex flex-col gap-3">
          {modes.map((m) => (
            <div key={m.label} className="border-l-2 border-gold pl-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="brutal-heading text-sm text-gold md:text-base">
                  {m.label}
                </span>
                <span className="font-mono text-xs uppercase tracking-brutal text-muted">
                  {m.range}
                </span>
              </div>
              <p className="mt-1 font-mono text-sm text-bone">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tribe({ name, body }: { name: string; body: string }) {
  return (
    <div className="border-2 border-smoke p-4">
      <p className="brutal-heading text-base text-gold md:text-lg">{name}</p>
      <p className="mt-2 font-mono text-sm text-bone">{body}</p>
    </div>
  );
}

function Rule({
  label,
  body,
  color = "bone",
}: {
  label: string;
  body: string;
  color?: "bone" | "gold" | "blood";
}) {
  const c = color === "gold" ? "text-gold" : color === "blood" ? "text-blood" : "text-bone";
  return (
    <div className="border-l-2 border-smoke pl-4">
      <p className={`brutal-heading text-sm md:text-base ${c}`}>{label}</p>
      <p className="mt-1 font-mono text-sm text-bone md:text-base">{body}</p>
    </div>
  );
}

function Stat({
  label,
  shorthand,
  body,
  color = "bone",
}: {
  label: string;
  shorthand: string;
  body: string;
  color?: "bone" | "gold";
}) {
  const border = color === "gold" ? "border-gold" : "border-bone";
  const heading = color === "gold" ? "text-gold" : "text-bone";
  return (
    <div className={`border-2 ${border} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`brutal-heading text-lg md:text-xl ${heading}`}>{label}</p>
        <span className="font-mono text-xs uppercase tracking-brutal text-muted">
          {shorthand}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm text-bone md:text-base">{body}</p>
    </div>
  );
}

function Axis({ label, body }: { label: string; body: string }) {
  return (
    <div className="border-l-2 border-gold pl-4">
      <p className="brutal-heading text-sm text-gold md:text-base">{label}</p>
      <p className="mt-1 font-mono text-sm text-bone md:text-base">{body}</p>
    </div>
  );
}

function Tip({ n, body }: { n: string; body: string }) {
  return (
    <div className="flex gap-4 border-l-2 border-bone pl-4">
      <span className="brutal-heading text-lg text-gold md:text-xl">{n}</span>
      <p className="font-mono text-sm text-bone md:text-base">{body}</p>
    </div>
  );
}

function Gold({ children }: { children: React.ReactNode }) {
  return <span className="text-gold">{children}</span>;
}
