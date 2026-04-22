import { Link } from "react-router-dom";

/**
 * Public landing for Private Circles. Explains the three tier bands and sends
 * visitors to /pricing to actually subscribe. Replaces the old email-based
 * application form — the Stripe pass handles payment end-to-end.
 */
export function CirclesPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          PRIVATE CIRCLES
        </p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl lg:text-8xl">
          BRING PARADOX IN-HOUSE.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          A closed PARADOX instance for your school, your university, your team.
          Age-targeted dilemmas, private matchmaking, and your own archive. Pick
          the tier that fits and spin up your first circle in minutes.
        </p>
        <div className="mt-6">
          <Link to="/pricing" className="brutal-btn brutal-btn-gold inline-block">
            VIEW PRICING
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Tier
          label="SCHOOLS"
          title="JR. HIGH & HIGH SCHOOL"
          blurb="Turn homeroom into a thinking gym. Age-appropriate dilemmas, teacher-grade sensibility, class-sized matchmaking."
          bullets={[
            "Jr. High and High School dilemma packs",
            "Per-class games on class schedules",
            "Teacher audit view (coming soon)",
            "Invite codes that seat a whole period",
          ]}
        />
        <Tier
          label="UNIVERSITIES"
          title="UNIVERSITY"
          blurb="Applied ethics, political philosophy, research ethics. Seminars that argue in writing, not just in person."
          bullets={[
            "University-grade dilemma pack",
            "Department-wide or seminar-scoped games",
            "Professor audit view (coming soon)",
            "Scale to thousands of students",
          ]}
        />
        <Tier
          label="ORGS"
          title="CORPORATE"
          blurb="Run company-wide ethics cohorts. Leadership, whistleblowing, workplace fairness — the dilemmas your team should already be arguing about."
          bullets={[
            "Corporate dilemma pack",
            "Team or department games",
            "Manager audit view (coming soon)",
            "Unlimited-seat plans available",
          ]}
        />
      </section>

      {/* Dens — warmer, friends-and-family framing. Gold-heavy to contrast
          with the bone-bordered institutional grid above. */}
      <section className="border-2 border-gold p-5 md:p-6">
        <p className="brutal-heading text-xs text-gold">PERSONAL</p>
        <h2 className="brutal-heading mt-3 text-3xl text-bone md:text-5xl">
          PRIVATE DENS
        </h2>
        <p className="mt-3 max-w-2xl font-mono text-sm text-bone md:text-base">
          Your crew. Your paradoxes. Your archive. A closed circle for friends,
          family, or anyone you actually want to debate.
        </p>

        <ul className="mt-5 grid grid-cols-1 gap-2 font-mono text-sm text-bone md:grid-cols-2">
          <li className="border-l-2 border-gold pl-3">
            Private matchmaking within your Den
          </li>
          <li className="border-l-2 border-gold pl-3">
            Shared synthesis archive
          </li>
          <li className="border-l-2 border-gold pl-3">
            Group tribe leaderboard
          </li>
          <li className="border-l-2 border-gold pl-3">
            Invite via shareable link
          </li>
          <li className="border-l-2 border-gold pl-3">
            Den Stats — how your group thinks
          </li>
        </ul>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <DenTier
            title="DEN STARTER"
            seats="UP TO 5 MEMBERS"
            blurb="The smallest circle. Four friends plus you."
          />
          <DenTier
            title="DEN PLUS"
            seats="UP TO 15 MEMBERS"
            blurb="Extended family, a book club, a whole group chat."
            featured
          />
        </div>

        <div className="mt-6">
          <Link
            to="/pricing?tab=personal"
            className="brutal-btn brutal-btn-gold inline-block"
          >
            VIEW PRICING
          </Link>
        </div>
      </section>

      {/* Colosseum — live party mode. Bold, separate section to read as a
          distinct product, not another Circle tier. */}
      <section className="border-2 border-bone p-5 md:p-6">
        <p className="brutal-heading text-xs text-gold">PARTY MODE</p>
        <h2 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl">
          THE COLOSSEUM.
        </h2>
        <p className="mt-4 max-w-2xl font-mono text-sm text-bone md:text-base">
          Cast the dilemma to your TV. Vote on your phones. Debate in person.
          A live party game powered by PARADOX.
        </p>

        <ul className="mt-5 grid grid-cols-1 gap-2 font-mono text-sm text-bone md:grid-cols-2">
          <li className="border-l-2 border-gold pl-3">
            Kahoot-style live voting
          </li>
          <li className="border-l-2 border-gold pl-3">
            Cast mode for TV / big screen
          </li>
          <li className="border-l-2 border-gold pl-3">
            Real-time vote reveal
          </li>
          <li className="border-l-2 border-gold pl-3">
            AI tribe assignments, live
          </li>
          <li className="border-l-2 border-gold pl-3">
            In-person duel suggestions
          </li>
          <li className="border-l-2 border-gold pl-3">
            Game history on your profile
          </li>
        </ul>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="border-2 border-bone p-4">
            <p className="brutal-heading text-xs text-gold">PARTY BASIC — $9.99/MO</p>
            <p className="mt-2 font-mono text-sm text-bone">
              1-hour free trial, no card · then unlimited games · up to 8
              players · standard paradox pack
            </p>
          </article>
          <article className="border-2 border-gold p-4">
            <p className="brutal-heading text-xs text-gold">PARTY PRO — $29.99/MO</p>
            <p className="mt-2 font-mono text-sm text-bone">
              1-hour free trial, no card · then unlimited games · up to 25
              players · all paradox packs · full game history
            </p>
          </article>
        </div>

        <div className="mt-6">
          <Link to="/pricing" className="brutal-btn brutal-btn-gold inline-block">
            VIEW PRICING
          </Link>
        </div>
      </section>

      <section className="border-2 border-bone p-5 md:p-6">
        <p className="brutal-heading text-sm text-gold">WHAT YOU GET</p>
        <ul className="mt-4 grid grid-cols-1 gap-3 font-mono text-sm text-bone md:grid-cols-2 md:text-base">
          <li className="border-l-2 border-gold pl-3">
            A <span className="text-gold">closed instance</span> — your members only see each other, match only with each other.
          </li>
          <li className="border-l-2 border-gold pl-3">
            Age- and role-targeted <span className="text-gold">dilemma packs</span> built for your audience.
          </li>
          <li className="border-l-2 border-gold pl-3">
            <span className="text-gold">Per-game games</span> — run each class, cohort, or department on its own schedule.
          </li>
          <li className="border-l-2 border-gold pl-3">
            <span className="text-gold">One-click invite codes</span> — paste in the syllabus or the #ethics channel.
          </li>
        </ul>
      </section>

      <footer className="border-t-2 border-smoke pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm text-muted">
            Ready to roll out a circle for your org?
          </p>
          <Link to="/pricing" className="brutal-btn brutal-btn-gold">
            VIEW PRICING
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Tier({
  label,
  title,
  blurb,
  bullets,
}: {
  label: string;
  title: string;
  blurb: string;
  bullets: string[];
}) {
  return (
    <article className="border-2 border-bone p-5 md:p-6">
      <p className="brutal-heading text-xs text-gold">{label}</p>
      <h3 className="brutal-heading mt-2 text-2xl text-bone md:text-3xl">{title}</h3>
      <p className="mt-3 font-mono text-sm text-bone md:text-base">{blurb}</p>
      <ul className="mt-4 flex flex-col gap-2 font-mono text-sm text-bone">
        {bullets.map((b) => (
          <li key={b} className="border-l-2 border-smoke pl-3">
            {b}
          </li>
        ))}
      </ul>
    </article>
  );
}

function DenTier({
  title,
  seats,
  blurb,
  featured,
}: {
  title: string;
  seats: string;
  blurb: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`border-2 p-4 md:p-5 ${
        featured ? "border-gold" : "border-smoke"
      }`}
    >
      <p
        className={`brutal-heading text-xs ${featured ? "text-gold" : "text-muted"}`}
      >
        {title}
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-gold">
        {seats}
      </p>
      <p className="mt-2 font-mono text-sm text-bone">{blurb}</p>
    </article>
  );
}
