import { Link } from "react-router-dom";

export function PricingCancelPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 md:px-6 md:py-16">
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">CHECKOUT CANCELED</p>
      <h1 className="brutal-heading text-4xl text-bone md:text-6xl">NO CHARGE.</h1>
      <p className="font-mono text-base text-bone md:text-lg">
        You closed the Stripe checkout before completing payment. Nothing was billed and
        no circle was created.
      </p>
      <div className="border-2 border-smoke p-5">
        <p className="brutal-heading text-sm text-gold">STILL HAVE QUESTIONS?</p>
        <p className="mt-2 font-mono text-sm text-bone">
          Drop us a note via the feedback form and we'll help you pick a plan — or comp
          you beta access while you evaluate.
        </p>
        <Link to="/feedback" className="brutal-btn brutal-btn-gold mt-4 inline-block">
          CONTACT US
        </Link>
      </div>
      <Link to="/pricing" className="brutal-btn brutal-btn-gold self-start">
        ← BACK TO PRICING
      </Link>
    </div>
  );
}
