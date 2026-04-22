import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../context/AuthContext.tsx";

/* ---------- types (mirror the server router) ---------- */

type CircleType = "JUNIOR_HIGH" | "HIGH_SCHOOL" | "UNIVERSITY" | "CORPORATE";
type Role = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
type Package = "STANDARD" | "JUNIOR_HIGH" | "HIGH_SCHOOL" | "UNIVERSITY" | "CORPORATE";

interface CircleSummary {
  id: string;
  name: string;
  type: CircleType;
  subscriptionStatus: string;
  role: Role;
  memberCount: number;
  gameCount: number;
  createdAt: string;
}

interface InviteCode {
  id: string;
  code: string;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Game {
  id: string;
  name: string;
  description: string | null;
  paradoxPackage: Package;
  dropHour: number;
  vowEndHour: number;
  sortEndHour: number;
  duelHour: number;
  isActive: boolean;
  createdAt: string;
  inviteCodes?: InviteCode[];
  _count: { inviteCodes: number };
}

interface CircleDetail {
  id: string;
  name: string;
  type: CircleType;
  subscriptionStatus: string;
  stripePriceLookupKey: string | null;
  billingPeriod: string | null;
  seatLimit: number | null;
  currentPeriodEnd: string | null;
  planLabel: string | null;
  hasStripeCustomer: boolean;
  memberCount: number;
  createdAt: string;
  ownerId: string;
  games: Game[];
  _count: { memberships: number };
}

interface Member {
  id: string;
  role: Role;
  joinedAt: string;
  user: { id: string; username: string; wisdomPoints: number; civilityScore: number };
}

const TYPE_LABEL: Record<CircleType, string> = {
  JUNIOR_HIGH: "Jr. High School",
  HIGH_SCHOOL: "High School",
  UNIVERSITY: "University",
  CORPORATE: "Corporate",
};

const PACKAGE_LABEL: Record<Package, string> = {
  STANDARD: "STANDARD (GLOBAL POOL)",
  JUNIOR_HIGH: "JR. HIGH PACK",
  HIGH_SCHOOL: "HIGH SCHOOL PACK",
  UNIVERSITY: "UNIVERSITY PACK",
  CORPORATE: "CORPORATE PACK",
};

/* ---------- top-level routing between list and detail ---------- */

export function CirclesManagePage() {
  const { circleId } = useParams<{ circleId?: string }>();
  return circleId ? <CircleDetailView circleId={circleId} /> : <CircleListView />;
}

/* ---------- LIST ---------- */

function CircleListView() {
  const { user, refreshUser } = useAuth();
  const hasAccess = Boolean(user?.hasCircleAccess);
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const { data } = await api.get<{ circles: CircleSummary[] }>("/circles/mine");
      setCircles(data.circles);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Could not load your circles."));
    }
  }

  async function onCircleDeleted() {
    // Reload the list AND refresh the user so ownsOrAdminsCircle /
    // hasCircleAccess reflect the new state (MANAGE nav link will hide if
    // this was the last circle they owned).
    await Promise.all([load(), refreshUser()]);
  }

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <Shell>
        <div className="brutal-card-blood">
          <p className="brutal-heading text-xl text-blood">PROBLEM.</p>
          <p className="mt-2 font-mono text-bone">{error}</p>
        </div>
      </Shell>
    );
  }

  if (!circles) {
    return (
      <Shell>
        <p className="brutal-heading text-xl text-muted">LOADING...</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          PRIVATE CIRCLES
        </p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl lg:text-7xl">
          MANAGE.
        </h1>
        <p className="mt-4 font-mono text-base text-bone md:text-lg">
          Closed PARADOX instances for schools, universities, and companies. Each
          circle holds one or more games with their own invite codes.
        </p>
      </header>

      {circles.length === 0 ? (
        <div className="border-2 border-smoke p-5 md:p-6">
          <p className="brutal-heading text-lg text-muted">NO CIRCLES YET.</p>
          <p className="mt-2 font-mono text-sm text-bone">
            Create one below, or join an existing circle from an invite code.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {circles.map((c) => (
            <div
              key={c.id}
              className="group relative border-2 border-bone focus-within:border-gold hover:border-gold"
            >
              <Link to={`/circles/manage/${c.id}`} className="block p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="brutal-heading text-xl text-bone md:text-2xl">
                    {c.name.toUpperCase()}
                  </p>
                  <RoleBadge role={c.role} />
                </div>
                <p className="mt-1 font-mono text-xs uppercase tracking-brutal text-muted">
                  {TYPE_LABEL[c.type]} · {c.subscriptionStatus.toUpperCase()}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs uppercase tracking-brutal text-muted">
                  <span>
                    <span className="text-gold">{c.memberCount}</span> MEMBERS
                  </span>
                  <span>
                    <span className="text-gold">{c.gameCount}</span> GAMES
                  </span>
                </div>
              </Link>
              {c.role === "OWNER" && (
                <div className="border-t border-smoke px-5 py-3">
                  <DeleteCircleButton
                    circleId={c.id}
                    circleName={c.name}
                    onDeleted={onCircleDeleted}
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {hasAccess ? (
        creating ? (
          <CreateCircleForm
            onDone={() => {
              setCreating(false);
              load();
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <button
            className="brutal-btn brutal-btn-gold self-start"
            onClick={() => setCreating(true)}
          >
            + CREATE CIRCLE
          </button>
        )
      ) : (
        <AccessGate />
      )}
    </Shell>
  );
}

function AccessGate() {
  return (
    <div className="border-2 border-gold p-5 md:p-6">
      <p className="brutal-heading text-sm text-gold">CIRCLE CREATION IS PAID.</p>
      <h2 className="brutal-heading mt-3 text-2xl text-bone md:text-3xl">
        GET ACCESS TO START A CIRCLE.
      </h2>
      <p className="mt-3 font-mono text-sm text-bone md:text-base">
        Closed PARADOX instances for schools, universities, and companies run
        on a subscription. Pick a tier that fits your org and go.
      </p>
      <Link to="/pricing" className="brutal-btn brutal-btn-gold mt-5 inline-block">
        GET ACCESS
      </Link>
    </div>
  );
}

function CreateCircleForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CircleType>("HIGH_SCHOOL");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/circles", { name: name.trim(), type });
      onDone();
    } catch (e) {
      setError(errorMessage(e, "Could not create the circle."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-2 border-gold p-5 md:p-6 flex flex-col gap-4">
      <p className="brutal-heading text-lg text-gold md:text-xl">NEW CIRCLE</p>
      <label className="flex flex-col gap-1">
        <span className="brutal-heading text-xs text-muted">NAME</span>
        <input
          className="brutal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
          placeholder="E.G. LINCOLN HIGH — PERIOD 1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="brutal-heading text-xs text-muted">TYPE</span>
        <select
          className="brutal-input appearance-none"
          value={type}
          onChange={(e) => setType(e.target.value as CircleType)}
        >
          <option value="JUNIOR_HIGH">Jr. High School</option>
          <option value="HIGH_SCHOOL">High School</option>
          <option value="UNIVERSITY">University</option>
          <option value="CORPORATE">Corporate</option>
        </select>
      </label>
      {error && (
        <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="brutal-btn brutal-btn-gold">
          {busy ? "..." : "CREATE"}
        </button>
        <button type="button" onClick={onCancel} className="brutal-btn">
          CANCEL
        </button>
      </div>
    </form>
  );
}

/* ---------- DETAIL ---------- */

function CircleDetailView({ circleId }: { circleId: string }) {
  const [data, setData] = useState<{
    circle: CircleDetail;
    viewer: { role: Role; isManager: boolean };
  } | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingGame, setCreatingGame] = useState(false);

  async function loadAll() {
    try {
      const [detail, memberList] = await Promise.all([
        api.get<{ circle: CircleDetail; viewer: { role: Role; isManager: boolean } }>(
          `/circles/${circleId}`,
        ),
        api.get<{ members: Member[] }>(`/circles/${circleId}/members`),
      ]);
      setData(detail.data);
      setMembers(memberList.data.members);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Could not load the circle."));
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId]);

  if (error) {
    return (
      <Shell>
        <div className="brutal-card-blood">
          <p className="brutal-heading text-xl text-blood">NOT FOUND.</p>
          <p className="mt-2 font-mono text-bone">{error}</p>
          <Link
            to="/circles/manage"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-brutal text-gold hover:text-bone"
          >
            ← BACK TO CIRCLES
          </Link>
        </div>
      </Shell>
    );
  }

  if (!data || !members) {
    return (
      <Shell>
        <p className="brutal-heading text-xl text-muted">LOADING...</p>
      </Shell>
    );
  }

  const { circle, viewer } = data;

  return (
    <Shell>
      <div>
        <Link
          to="/circles/manage"
          className="font-mono text-xs uppercase tracking-brutal text-muted hover:text-bone"
        >
          ← ALL CIRCLES
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-brutal text-muted">
              {TYPE_LABEL[circle.type]}
            </p>
            <h1 className="brutal-heading mt-2 text-4xl text-bone md:text-6xl">
              {circle.name.toUpperCase()}
            </h1>
          </div>
          <RoleBadge role={viewer.role} />
        </div>
        <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
          {members.length} MEMBERS · {circle.games.length} GAMES ·{" "}
          <span className="text-gold">{circle.subscriptionStatus.toUpperCase()}</span>
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-smoke pb-3">
          <h2 className="brutal-heading text-xl text-bone md:text-2xl">GAMES</h2>
          {viewer.isManager &&
            (creatingGame ? null : (
              <button
                onClick={() => setCreatingGame(true)}
                className="brutal-btn brutal-btn-gold"
              >
                + NEW GAME
              </button>
            ))}
        </div>

        {creatingGame && viewer.isManager && (
          <CreateGameForm
            circleId={circle.id}
            onDone={() => {
              setCreatingGame(false);
              loadAll();
            }}
            onCancel={() => setCreatingGame(false)}
          />
        )}

        {circle.games.length === 0 ? (
          <p className="border-2 border-smoke p-5 font-mono text-sm text-muted">
            NO GAMES YET. {viewer.isManager ? "Create the first one above." : ""}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {circle.games.map((g) => (
              <GameCard
                key={g.id}
                circleId={circle.id}
                game={g}
                isManager={viewer.isManager}
                onChanged={loadAll}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading border-b-2 border-smoke pb-3 text-xl text-bone md:text-2xl">
          MEMBERS
        </h2>
        <div className="flex flex-col">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-smoke py-3"
            >
              <div>
                <p className="brutal-heading text-base text-bone">
                  {m.user.username.toUpperCase()}
                </p>
                <p className="mt-1 font-mono text-xs uppercase tracking-brutal text-muted">
                  WP <span className="text-gold">{m.user.wisdomPoints}</span> · CIV{" "}
                  <span
                    className={
                      m.user.civilityScore < 40 ? "text-blood" : "text-bone"
                    }
                  >
                    {m.user.civilityScore}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RoleBadge role={m.role} />
                {viewer.isManager && m.role !== "OWNER" && (
                  <RemoveButton
                    circleId={circle.id}
                    userId={m.user.id}
                    onDone={loadAll}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {viewer.role === "OWNER" && (
        <SubscriptionPanel circle={circle} members={members.length} />
      )}
    </Shell>
  );
}

function SubscriptionPanel({
  circle,
  members,
}: {
  circle: CircleDetail;
  members: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<{ url: string }>("/stripe/portal", {
        circleId: circle.id,
      });
      window.location.href = data.url;
    } catch (e) {
      setError(errorMessage(e, "Could not open the billing portal."));
      setBusy(false);
    }
  }

  const seatText =
    circle.seatLimit === null
      ? `${members} / UNLIMITED`
      : `${members} / ${circle.seatLimit.toLocaleString()}`;
  const overLimit =
    circle.seatLimit !== null && members >= circle.seatLimit;

  const status = circle.subscriptionStatus.toLowerCase();
  const statusColor =
    status === "active" || status === "trialing"
      ? "border-gold text-gold"
      : status === "past_due"
        ? "border-blood text-blood"
        : status === "canceled"
          ? "border-blood text-blood"
          : "border-smoke text-muted";
  const billingLabel =
    circle.billingPeriod === "monthly"
      ? "BILLED MONTHLY"
      : circle.billingPeriod === "6month"
        ? "BILLED EVERY 6 MONTHS"
        : circle.billingPeriod === "annual"
          ? "BILLED ANNUALLY"
          : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="brutal-heading border-b-2 border-smoke pb-3 text-xl text-bone md:text-2xl">
        SUBSCRIPTION
      </h2>

      {status === "past_due" && (
        <div className="border-2 border-blood p-4">
          <p className="brutal-heading text-sm text-blood">PAYMENT FAILED.</p>
          <p className="mt-2 font-mono text-sm text-bone">
            Your last invoice didn't go through. Update your card in the billing portal
            before the next retry to keep the circle active.
          </p>
        </div>
      )}
      {status === "canceled" && (
        <div className="border-2 border-blood p-4">
          <p className="brutal-heading text-sm text-blood">SUBSCRIPTION CANCELED.</p>
          <p className="mt-2 font-mono text-sm text-bone">
            This circle will stop accepting new activity when the current period ends.
            Re-subscribe from the pricing page.
          </p>
        </div>
      )}

      <div className="border-2 border-bone p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-brutal text-muted">CURRENT PLAN</p>
            <p className="brutal-heading mt-1 text-xl text-bone md:text-2xl">
              {circle.planLabel ? circle.planLabel.toUpperCase() : "ADMIN-GRANTED"}
            </p>
            {billingLabel && (
              <p className="mt-1 font-mono text-xs uppercase tracking-brutal text-muted">
                {billingLabel}
              </p>
            )}
          </div>
          <span
            className={`border-2 px-3 py-1 font-mono text-xs uppercase tracking-brutal ${statusColor}`}
          >
            {circle.subscriptionStatus.toUpperCase().replace("_", " ")}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Cell label="SEATS USED" value={seatText} tone={overLimit ? "blood" : "bone"} />
          <Cell
            label="NEXT BILLING"
            value={
              circle.currentPeriodEnd
                ? new Date(circle.currentPeriodEnd).toLocaleDateString()
                : "—"
            }
            tone="bone"
          />
          <Cell
            label="BILLING PORTAL"
            value={circle.hasStripeCustomer ? "AVAILABLE" : "—"}
            tone={circle.hasStripeCustomer ? "gold" : "muted"}
          />
        </div>

        {error && (
          <p className="mt-4 border-2 border-blood p-3 font-mono text-sm text-blood">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {circle.hasStripeCustomer ? (
            <button
              onClick={openPortal}
              disabled={busy}
              className="brutal-btn brutal-btn-gold"
            >
              {busy ? "..." : "MANAGE BILLING"}
            </button>
          ) : (
            <Link to="/pricing" className="brutal-btn brutal-btn-gold">
              SUBSCRIBE
            </Link>
          )}
          {overLimit && (
            <span className="font-mono text-xs uppercase tracking-brutal text-blood self-center">
              SEAT LIMIT REACHED · UPGRADE TO ADD MORE
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "bone" | "gold" | "blood" | "muted";
}) {
  const v =
    tone === "gold"
      ? "text-gold"
      : tone === "blood"
        ? "text-blood"
        : tone === "muted"
          ? "text-muted"
          : "text-bone";
  return (
    <div className="border border-smoke p-3">
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">{label}</p>
      <p className={`brutal-heading mt-1 text-xl ${v}`}>{value}</p>
    </div>
  );
}

function CreateGameForm({
  circleId,
  onDone,
  onCancel,
}: {
  circleId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pkg, setPkg] = useState<Package>("STANDARD");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post(`/circles/${circleId}/games`, {
        name: name.trim(),
        description: description.trim() || undefined,
        paradoxPackage: pkg,
      });
      onDone();
    } catch (e) {
      setError(errorMessage(e, "Could not create the game."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-2 border-gold p-5 md:p-6 flex flex-col gap-4">
      <p className="brutal-heading text-lg text-gold md:text-xl">NEW GAME</p>
      <label className="flex flex-col gap-1">
        <span className="brutal-heading text-xs text-muted">NAME</span>
        <input
          className="brutal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={80}
          placeholder="E.G. PERIOD 1 CLASS"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="brutal-heading text-xs text-muted">DESCRIPTION (OPTIONAL)</span>
        <textarea
          className="brutal-input min-h-[80px] resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="brutal-heading text-xs text-muted">PARADOX PACKAGE</span>
        <select
          className="brutal-input appearance-none"
          value={pkg}
          onChange={(e) => setPkg(e.target.value as Package)}
        >
          {(["STANDARD", "JUNIOR_HIGH", "HIGH_SCHOOL", "UNIVERSITY", "CORPORATE"] as Package[]).map(
            (p) => (
              <option key={p} value={p}>
                {PACKAGE_LABEL[p]}
              </option>
            ),
          )}
        </select>
      </label>
      {error && (
        <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="brutal-btn brutal-btn-gold">
          {busy ? "..." : "CREATE GAME"}
        </button>
        <button type="button" onClick={onCancel} className="brutal-btn">
          CANCEL
        </button>
      </div>
    </form>
  );
}

function GameCard({
  circleId,
  game,
  isManager,
  onChanged,
}: {
  circleId: string;
  game: Game;
  isManager: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedule = useMemo(
    () =>
      `DROP ${pad(game.dropHour)} · VOW→${pad(game.vowEndHour)} · SORT→${pad(game.sortEndHour)} · DUEL ${pad(game.duelHour)}`,
    [game],
  );

  async function togglePause() {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/circles/${circleId}/games/${game.id}`, {
        isActive: !game.isActive,
      });
      onChanged();
    } catch (e) {
      setError(errorMessage(e, "Could not update."));
    } finally {
      setBusy(false);
    }
  }

  async function generateInvite() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/circles/${circleId}/games/${game.id}/invites`, {});
      onChanged();
      setOpen(true);
    } catch (e) {
      setError(errorMessage(e, "Could not generate invite."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`border-2 ${
        game.isActive ? "border-bone" : "border-smoke"
      } p-5`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="brutal-heading text-xl text-bone">{game.name.toUpperCase()}</p>
          {game.description && (
            <p className="mt-1 font-mono text-sm text-bone">{game.description}</p>
          )}
          <p className="mt-2 font-mono text-xs uppercase tracking-brutal text-muted">
            {PACKAGE_LABEL[game.paradoxPackage]} · {schedule}
          </p>
        </div>
        <span
          className={`border-2 px-2 py-1 font-mono text-xs uppercase tracking-brutal ${
            game.isActive ? "border-gold text-gold" : "border-blood text-blood"
          }`}
        >
          {game.isActive ? "ACTIVE" : "PAUSED"}
        </span>
      </div>

      {isManager && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="brutal-btn"
            disabled={busy}
          >
            {open ? "HIDE INVITES" : `INVITES · ${game._count.inviteCodes}`}
          </button>
          <button onClick={generateInvite} className="brutal-btn brutal-btn-gold" disabled={busy}>
            + GENERATE CODE
          </button>
          <button
            onClick={togglePause}
            className={`brutal-btn ${game.isActive ? "brutal-btn-blood" : "brutal-btn-gold"}`}
            disabled={busy}
          >
            {game.isActive ? "PAUSE" : "RESUME"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 border-2 border-blood p-3 font-mono text-sm text-blood">
          {error}
        </p>
      )}

      {isManager && open && game.inviteCodes && (
        <div className="mt-4 flex flex-col gap-2 border-t border-smoke pt-4">
          {game.inviteCodes.length === 0 ? (
            <p className="font-mono text-xs uppercase tracking-brutal text-muted">
              NO CODES YET.
            </p>
          ) : (
            game.inviteCodes.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-smoke p-2"
              >
                <code className="font-mono text-base tracking-[0.25em] text-gold">
                  {c.code}
                </code>
                <span className="font-mono text-xs uppercase tracking-brutal text-muted">
                  {c.uses}
                  {c.maxUses !== null && c.maxUses !== undefined
                    ? `/${c.maxUses}`
                    : ""}{" "}
                  USED
                  {c.expiresAt && ` · EXPIRES ${new Date(c.expiresAt).toLocaleDateString()}`}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </article>
  );
}

function RemoveButton({
  circleId,
  userId,
  onDone,
}: {
  circleId: string;
  userId: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!confirm("Remove this member from the circle?")) return;
    setBusy(true);
    try {
      await api.delete(`/circles/${circleId}/members/${userId}`);
      onDone();
    } catch {
      /* swallow — caller will reload */
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={remove}
      disabled={busy}
      aria-label="Remove member"
      className="border-2 border-smoke px-3 py-1 font-mono text-xs uppercase tracking-brutal text-muted hover:border-blood hover:text-blood"
    >
      REMOVE
    </button>
  );
}

function DeleteCircleButton({
  circleId,
  circleName,
  onDeleted,
}: {
  circleId: string;
  circleName: string;
  onDeleted: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/circles/${circleId}`);
      setOpen(false);
      await onDeleted();
    } catch (e) {
      setError(errorMessage(e, "Could not delete the circle."));
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="font-mono text-xs uppercase tracking-brutal text-muted hover:text-blood"
      >
        DELETE CIRCLE
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-circle-title-${circleId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4"
          onClick={() => {
            if (!busy) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg border-2 border-blood bg-ink p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id={`delete-circle-title-${circleId}`}
              className="brutal-heading text-2xl text-blood md:text-3xl"
            >
              DELETE {circleName.toUpperCase()}?
            </p>
            <p className="mt-4 font-mono text-sm text-bone md:text-base">
              This will permanently delete the circle and all its games. Member
              vote and duel history will be preserved on their profiles but will
              no longer be associated with this circle. This cannot be undone.
            </p>
            {error && (
              <p className="mt-4 border-2 border-blood p-3 font-mono text-sm text-blood">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="brutal-btn brutal-btn-blood"
              >
                {busy ? "DELETING..." : "DELETE CIRCLE"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="brutal-btn"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const color =
    role === "OWNER"
      ? "border-gold text-gold"
      : role === "ADMIN" || role === "MODERATOR"
        ? "border-bone text-bone"
        : "border-smoke text-muted";
  return (
    <span className={`border-2 px-2 py-1 font-mono text-xs uppercase tracking-brutal ${color}`}>
      {role}
    </span>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      {children}
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
