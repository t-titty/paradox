import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";

type CircleType = "JUNIOR_HIGH" | "HIGH_SCHOOL" | "UNIVERSITY" | "CORPORATE";

interface InvitePreview {
  invite: {
    code: string;
    game: { id: string; name: string; description: string | null };
    circle: { id: string; name: string; type: CircleType };
    expiresAt: string | null;
    usesRemaining: number | null;
  };
  status: {
    expired: boolean;
    exhausted: boolean;
    gamePaused: boolean;
    alreadyMember: boolean;
    canJoin: boolean;
  };
}

const TYPE_LABEL: Record<CircleType, string> = {
  JUNIOR_HIGH: "Jr. High School",
  HIGH_SCHOOL: "High School",
  UNIVERSITY: "University",
  CORPORATE: "Corporate",
};

export function JoinCirclePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinedCircleId, setJoinedCircleId] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setError(null);
    setPreview(null);
    api
      .get<InvitePreview>(`/circles/invites/${encodeURIComponent(code)}`)
      .then((r) => !cancelled && setPreview(r.data))
      .catch(
        (e) =>
          !cancelled &&
          setError(errorMessage(e, "That invite is not valid.")),
      );
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function confirmJoin() {
    if (!code) return;
    setJoining(true);
    setError(null);
    try {
      const { data } = await api.post<{
        circle: { id: string; name: string; type: CircleType };
        alreadyMember: boolean;
      }>(`/circles/invites/${encodeURIComponent(code)}/join`);
      setJoinedCircleId(data.circle.id);
    } catch (e) {
      setError(errorMessage(e, "Could not join."));
    } finally {
      setJoining(false);
    }
  }

  if (joinedCircleId) {
    return (
      <Shell>
        <div className="brutal-card-gold">
          <p className="brutal-heading text-sm text-gold">YOU'RE IN.</p>
          <h1 className="brutal-heading mt-3 text-3xl text-bone md:text-5xl">WELCOME.</h1>
          <p className="mt-4 font-mono text-base text-bone">
            You've joined the circle. Your Today page will start pulling from this game
            once per-game routing ships — for now you'll see your circle in MANAGE.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/circles/manage/${joinedCircleId}`}
              className="brutal-btn brutal-btn-gold"
            >
              GO TO CIRCLE
            </Link>
            <button onClick={() => navigate("/")} className="brutal-btn">
              GO TO TODAY
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="brutal-card-blood">
          <p className="brutal-heading text-xl text-blood">INVALID INVITE.</p>
          <p className="mt-2 font-mono text-bone">{error}</p>
          <Link
            to="/circles/manage"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-brutal text-gold hover:text-bone"
          >
            ← GO TO YOUR CIRCLES
          </Link>
        </div>
      </Shell>
    );
  }

  if (!preview) {
    return (
      <Shell>
        <p className="brutal-heading text-xl text-muted">LOADING INVITE...</p>
      </Shell>
    );
  }

  const { invite, status } = preview;

  return (
    <Shell>
      <div>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">CIRCLE INVITE</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl">YOU'RE INVITED.</h1>
      </div>

      <div className="border-2 border-gold p-5 md:p-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-gold">
          {TYPE_LABEL[invite.circle.type]}
        </p>
        <h2 className="brutal-heading mt-2 text-2xl text-bone md:text-4xl">
          {invite.circle.name.toUpperCase()}
        </h2>
        <p className="mt-4 font-mono text-xs uppercase tracking-brutal text-muted">JOINING GAME</p>
        <p className="mt-1 brutal-heading text-xl text-bone">{invite.game.name.toUpperCase()}</p>
        {invite.game.description && (
          <p className="mt-2 font-mono text-sm text-bone">{invite.game.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-brutal text-muted">
          <span>
            CODE ·{" "}
            <code className="text-gold tracking-[0.2em]">{invite.code}</code>
          </span>
          {invite.usesRemaining !== null && (
            <span>
              USES LEFT · <span className="text-bone">{invite.usesRemaining}</span>
            </span>
          )}
          {invite.expiresAt && (
            <span>
              EXPIRES ·{" "}
              <span className="text-bone">
                {new Date(invite.expiresAt).toLocaleDateString()}
              </span>
            </span>
          )}
        </div>
      </div>

      {status.alreadyMember ? (
        <div className="border-2 border-bone p-5">
          <p className="brutal-heading text-lg text-bone">YOU'RE ALREADY IN.</p>
          <p className="mt-2 font-mono text-sm text-bone">
            This invite points to a circle you've already joined.
          </p>
          <Link
            to={`/circles/manage/${invite.circle.id}`}
            className="brutal-btn brutal-btn-gold mt-4 inline-block"
          >
            GO TO CIRCLE
          </Link>
        </div>
      ) : status.canJoin ? (
        <button
          onClick={confirmJoin}
          disabled={joining}
          className="brutal-btn brutal-btn-gold self-start"
        >
          {joining ? "..." : "ACCEPT & JOIN"}
        </button>
      ) : (
        <div className="border-2 border-blood p-5">
          <p className="brutal-heading text-lg text-blood">
            {status.expired
              ? "INVITE EXPIRED."
              : status.exhausted
                ? "INVITE FULLY USED."
                : "GAME PAUSED."}
          </p>
          <p className="mt-2 font-mono text-sm text-bone">
            Ask the circle owner to generate a fresh code.
          </p>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      {children}
    </div>
  );
}
