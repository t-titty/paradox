import { Link } from "react-router-dom";

/**
 * Stub. Real self-serve checkout + tier selection lands with the Stripe pass;
 * this keeps the CTA on /circles and the Get Access button on /circles/manage
 * from dead-ending. Admins can grant access manually from the admin panel in
 * the meantime.
 */
export function PricingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">PRICING</p>
        <h1 className="brutal-heading mt-3 text-5xl text-bone md:text-7xl">
          LAUNCHING SHORTLY.
        </h1>
        <p className="mt-6 max-w-2xl font-mono text-base text-bone md:text-lg">
          Self-serve subscriptions for schools, universities, and organizations are in
          the queue. The plans and seat tiers are already designed — checkout just
          isn't wired yet.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Band label="SCHOOLS" sub="Jr. High & High School" />
        <Band label="UNIVERSITIES" sub="Undergrad & Grad" />
        <Band label="ORGS" sub="Corporate & Teams" />
      </section>

      <div className="border-2 border-gold p-5 md:p-6">
        <p className="brutal-heading text-sm text-gold">BETA ACCESS</p>
        <p className="mt-3 font-mono text-sm text-bone md:text-base">
          Want early access for your school or team? Send us a note via the feedback
          form and we'll flip the grant manually. Once Stripe is live this page turns
          into a real self-serve checkout.
        </p>
        <Link to="/feedback" className="brutal-btn brutal-btn-gold mt-5 inline-block">
          REQUEST ACCESS
        </Link>
      </div>

      <Link
        to="/circles"
        className="font-mono text-xs uppercase tracking-brutal text-muted hover:text-bone"
      >
        ← BACK TO CIRCLES
      </Link>
    </div>
  );
}

function Band({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="border-2 border-bone p-4">
      <p className="brutal-heading text-xs text-gold">{label}</p>
      <p className="brutal-heading mt-2 text-xl text-bone">{sub.toUpperCase()}</p>
      <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
        TIER PRICING · COMING SOON
      </p>
    </div>
  );
}
