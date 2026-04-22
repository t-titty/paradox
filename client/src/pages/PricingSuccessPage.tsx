import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

interface SessionInfo {
  organizationName: string | null;
  planName: string | null;
  paymentStatus: string;
  circle: { id: string; name: string } | null;
}

/**
 * Confirms a completed Checkout. Stripe's success_url carries session_id.
 * The server reads the Session (verifying it belongs to the current user)
 * and hands back the org name, plan, and circle id — the webhook may or may
 * not have created the Circle by the time this page loads, so we poll
 * briefly if needed.
 */
export function PricingSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session id.");
      return;
    }
    let cancelled = false;
    let tries = 0;

    async function poll() {
      try {
        const { data } = await api.get<SessionInfo>(
          `/stripe/session/${encodeURIComponent(sessionId!)}`,
        );
        if (cancelled) return;
        setInfo(data);
        // Webhook may still be in flight — retry up to ~5 times so the
        // "SET UP YOUR FIRST GAME" button links straight to the Circle.
        if (!data.circle && tries < 5) {
          tries += 1;
          setTimeout(poll, 1200);
        }
      } catch (e) {
        if (!cancelled) setError(errorMessage(e, "Could not confirm payment."));
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (error) {
    return (
      <Shell>
        <div className="brutal-card-blood">
          <p className="brutal-heading text-xl text-blood">SOMETHING IS OFF.</p>
          <p className="mt-2 font-mono text-bone">{error}</p>
          <p className="mt-3 font-mono text-sm text-muted">
            If you were just charged, your circle will appear in MANAGE within a minute.
          </p>
          <Link
            to="/circles/manage"
            className="brutal-btn brutal-btn-gold mt-4 inline-block"
          >
            GO TO MY CIRCLES
          </Link>
        </div>
      </Shell>
    );
  }

  if (!info) {
    return (
      <Shell>
        <p className="brutal-heading text-xl text-muted">CONFIRMING PAYMENT...</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="border-2 border-gold p-5 md:p-6">
        <p className="brutal-heading text-sm text-gold">PAYMENT RECEIVED.</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl">
          YOU'RE IN.
        </h1>
        <div className="mt-4 grid grid-cols-1 gap-3 font-mono text-sm text-bone md:grid-cols-2 md:text-base">
          {info.organizationName && (
            <p>
              <span className="text-muted uppercase tracking-brutal">ORGANIZATION · </span>
              <span className="text-gold">{info.organizationName}</span>
            </p>
          )}
          {info.planName && (
            <p>
              <span className="text-muted uppercase tracking-brutal">PLAN · </span>
              <span className="text-gold">{info.planName}</span>
            </p>
          )}
        </div>
        <p className="mt-4 font-mono text-sm text-bone md:text-base">
          Your circle is being provisioned. Next step: create your first game inside it,
          then generate an invite code and paste it in your syllabus or Slack.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {info.circle ? (
            <Link
              to={`/circles/manage/${info.circle.id}`}
              className="brutal-btn brutal-btn-gold"
            >
              SET UP YOUR FIRST GAME
            </Link>
          ) : (
            <Link to="/circles/manage" className="brutal-btn brutal-btn-gold">
              GO TO MY CIRCLES
            </Link>
          )}
          <Link to="/how-to-play" className="brutal-btn">
            HOW THE GAME WORKS
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      {children}
    </div>
  );
}
