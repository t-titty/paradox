import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Constellation } from "../components/Constellation.tsx";
import { TribeBarChart } from "../components/TribeBarChart.tsx";
import { FlashbackCard } from "../components/FlashbackCard.tsx";
import {
  currentPermission,
  disablePush,
  enablePush,
  isSubscribed,
  pushSupported,
} from "../lib/push.ts";
import type { Choice, Tribe } from "../lib/types.ts";
import { formatAirDate } from "../lib/dates.ts";
import { ProgressionPanel, type Progression } from "../components/ProgressionPanel.tsx";

interface ProfileData extends Progression {
  user: {
    id: string;
    username: string;
    wisdomPoints: number;
    civilityScore: number;
    isPremium: boolean;
    createdAt: string;
  };
  history: {
    tribe: Tribe;
    airDate: string;
    paradox: { id: string; title: string; category: string };
  }[];
  tribeCounts: Record<Tribe, number>;
  constellation: {
    position: [number, number, number];
    axes: { x: number; y: number; z: number };
    trajectory: { tribe: Tribe; position: [number, number, number] }[];
  };
  submittedParadoxes: {
    id: string;
    title: string;
    category: string;
    airDate: string | null;
  }[];
}

interface FlashbackResponse {
  flashback: {
    id: string;
    choice: Choice;
    justification: string;
    tribeAssigned: Tribe | null;
    createdAt: string;
    paradox: {
      id: string;
      title: string;
      description: string;
      optionA: string;
      optionB: string;
    };
  } | null;
  minDays: number;
}

export function ProfilePage() {
  const params = useParams<{ username?: string }>();
  const { user: me, refreshUser } = useAuth();
  const username = params.username ?? me?.username ?? "";
  const isSelf = me?.username === username;

  const [data, setData] = useState<ProfileData | null>(null);
  const [flashback, setFlashback] = useState<FlashbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setError(null);
    setData(null);
    api
      .get<ProfileData>(`/profile/${encodeURIComponent(username)}`)
      .then((r) => !cancelled && setData(r.data))
      .catch((e) => !cancelled && setError(errorMessage(e, "Profile not found.")));
    return () => {
      cancelled = true;
    };
  }, [username, reloadKey]);

  useEffect(() => {
    if (!isSelf) {
      setFlashback(null);
      return;
    }
    let cancelled = false;
    api
      .get<FlashbackResponse>("/flashback")
      .then((r) => !cancelled && setFlashback(r.data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSelf]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-16">
        <div className="brutal-card-blood">
          <p className="brutal-heading text-2xl text-blood">NOT FOUND</p>
          <p className="mt-3 font-mono text-bone">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-16">
        <p className="brutal-heading text-xl text-muted">LOADING...</p>
      </div>
    );
  }

  const { user, history, tribeCounts, constellation, submittedParadoxes } = data;
  const joined = new Date(user.createdAt).toDateString().toUpperCase();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">MORAL CONSTELLATION</p>
        <h1 className="brutal-heading mt-3 break-words text-4xl text-bone md:text-6xl lg:text-7xl">
          {user.username.toUpperCase()}
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-muted">
          JOINED {joined}
          {user.isPremium && <span className="ml-3 text-gold">· ★ SUPPORTER</span>}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="WISDOM POINTS" value={String(user.wisdomPoints)} tone="gold" />
        <Stat
          label="CIVILITY"
          value={`${user.civilityScore}/100`}
          tone={user.civilityScore < 40 ? "blood" : user.civilityScore < 70 ? "bone" : "gold"}
        />
        <Stat label="DUELS FOUGHT" value={String(data.stats.pvpDuels)} tone="bone" />
        <Stat
          label="DOMINANT TRIBE"
          value={dominantTribe(tribeCounts)}
          tone="bone"
        />
      </section>

      <ProgressionPanel
        data={data}
        isSelf={isSelf}
        wisdomPoints={user.wisdomPoints}
        onChanged={() => {
          setReloadKey((k) => k + 1);
          void refreshUser?.();
        }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="brutal-heading text-sm text-muted">CONSTELLATION · {history.length} VOWS</h2>
        <Constellation position={constellation.position} trajectory={constellation.trajectory} />
        <div className="grid grid-cols-1 gap-2 font-mono text-xs text-muted md:grid-cols-3">
          <p>
            X · <span className="text-bone">DEONTOLOGY ↔ CONSEQUENTIALISM</span>
            <span className="ml-2 text-gold">{constellation.axes.x.toFixed(2)}</span>
          </p>
          <p>
            Y · <span className="text-bone">INDIVIDUALISM ↔ COLLECTIVISM</span>
            <span className="ml-2 text-gold">{constellation.axes.y.toFixed(2)}</span>
          </p>
          <p>
            Z · <span className="text-bone">EMOTIONAL ↔ RATIONAL</span>
            <span className="ml-2 text-gold">{constellation.axes.z.toFixed(2)}</span>
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="brutal-heading text-sm text-muted">TRIBAL HISTORY</h2>
        <TribeBarChart counts={tribeCounts} />
      </section>

      {submittedParadoxes.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="brutal-heading text-sm text-muted">
            SUBMITTED PARADOXES · {submittedParadoxes.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {submittedParadoxes.map((p) => (
              <article key={p.id} className="border-2 border-gold p-4">
                <p className="font-mono text-xs uppercase tracking-brutal text-muted">
                  {p.category} ·{" "}
                  {p.airDate
                    ? formatAirDate(p.airDate)
                    : "UNSCHEDULED"}
                </p>
                <h3 className="brutal-heading mt-2 text-xl text-bone">
                  {p.title.toUpperCase()}
                </h3>
                <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-gold">
                  APPROVED · LIVE IN THE ROTATION
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {isSelf && flashback && flashback.flashback && (
        <section className="flex flex-col gap-4">
          <h2 className="brutal-heading text-sm text-muted">FROM THE VAULT</h2>
          <FlashbackCard flashback={flashback.flashback} />
        </section>
      )}

      {isSelf && flashback && flashback.flashback === null && (
        <section className="border border-smoke p-4 font-mono text-xs uppercase tracking-brutal text-muted">
          NO FLASHBACK AVAILABLE · YOUR OLDEST VOWS MUST BE AT LEAST {flashback.minDays} DAYS OLD.
        </section>
      )}

      {isSelf && <NotificationsSection />}

      {isSelf && (
        <SecuritySection
          twoFactorEnabled={Boolean(me?.twoFactorEnabled)}
          onChange={refreshUser}
        />
      )}
    </div>
  );
}

function NotificationsSection() {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const perm = currentPermission();
    setPermission(perm);
    if (perm === "granted") {
      setSubscribed(await isSubscribed());
    } else {
      setSubscribed(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onEnable() {
    setBusy(true);
    setError(null);
    try {
      const sub = await enablePush();
      if (!sub) {
        setError(
          "Browser declined the permission, or notifications aren't configured on this deploy.",
        );
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function onDisable() {
    setBusy(true);
    setError(null);
    try {
      await disablePush();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  const unsupported = permission === "unsupported";
  const blocked = permission === "denied";
  const enabled = permission === "granted" && subscribed;

  const status = unsupported
    ? "UNSUPPORTED"
    : blocked
      ? "BLOCKED"
      : enabled
        ? "ON"
        : "OFF";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="brutal-heading text-sm text-muted">NOTIFICATIONS</h2>
      <div className="border-2 border-bone p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-smoke pb-4">
          <div>
            <p className="brutal-heading text-xl text-bone md:text-2xl">
              WEB PUSH
            </p>
            <p className="mt-2 font-mono text-sm text-muted">
              Drop at 8 AM · Vow closes at noon · Duel begins at 8 PM.
            </p>
          </div>
          <span
            className={`border-2 px-3 py-1 font-mono text-xs uppercase tracking-brutal ${
              enabled ? "border-gold text-gold" : "border-smoke text-muted"
            }`}
          >
            {status}
          </span>
        </div>
        <div className="mt-5">
          {unsupported && (
            <p className="font-mono text-sm text-muted">
              This browser doesn't support Web Push. Try a recent Chrome,
              Firefox, or Edge.
            </p>
          )}
          {blocked && (
            <p className="font-mono text-sm text-blood">
              Notifications are blocked at the browser level. Re-enable them
              in your site permissions, then reload.
            </p>
          )}
          {!unsupported && !blocked && (
            <div className="flex flex-wrap gap-3">
              {enabled ? (
                <button
                  type="button"
                  onClick={onDisable}
                  disabled={busy}
                  className="brutal-btn brutal-btn-blood"
                >
                  {busy ? "..." : "DISABLE NOTIFICATIONS"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onEnable}
                  disabled={busy || !pushSupported()}
                  className="brutal-btn brutal-btn-gold"
                >
                  {busy ? "..." : "ENABLE NOTIFICATIONS"}
                </button>
              )}
            </div>
          )}
          {error && (
            <p className="mt-3 border-2 border-blood p-3 font-mono text-sm text-blood">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SecuritySection({
  twoFactorEnabled,
  onChange,
}: {
  twoFactorEnabled: boolean;
  onChange: () => Promise<void>;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="brutal-heading text-sm text-muted">SECURITY</h2>
      <div className="border-2 border-bone p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-smoke pb-4">
          <div>
            <p className="brutal-heading text-xl text-bone md:text-2xl">
              TWO-FACTOR AUTHENTICATION
            </p>
            <p className="mt-2 font-mono text-sm text-muted">
              TOTP via Google Authenticator, Authy, or any compatible app.
            </p>
          </div>
          <span
            className={`border-2 px-3 py-1 font-mono text-xs uppercase tracking-brutal ${
              twoFactorEnabled ? "border-gold text-gold" : "border-smoke text-muted"
            }`}
          >
            {twoFactorEnabled ? "ENABLED" : "OFF"}
          </span>
        </div>
        <div className="mt-5">
          {twoFactorEnabled ? (
            <DisableTwoFactor onDone={onChange} />
          ) : (
            <EnableTwoFactor onDone={onChange} />
          )}
        </div>
      </div>
    </section>
  );
}

interface SetupResponse {
  otpauthUrl: string;
  qrDataUrl: string;
  secret: string;
}

function EnableTwoFactor({ onDone }: { onDone: () => Promise<void> }) {
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startSetup() {
    setError(null);
    setBusy(true);
    try {
      const { data } = await api.post<SetupResponse>("/auth/2fa/setup");
      setSetup(data);
    } catch (e) {
      setError(errorMessage(e, "Could not start 2FA setup."));
    } finally {
      setBusy(false);
    }
  }

  async function submitEnable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/2fa/enable", { code });
      await onDone();
      setSetup(null);
      setCode("");
    } catch (e) {
      setError(errorMessage(e, "Invalid authenticator code."));
    } finally {
      setBusy(false);
    }
  }

  if (!setup) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-sm text-bone md:text-base">
          Add a second factor so a stolen password isn't enough to take your account.
          Requires an authenticator app on your phone.
        </p>
        {error && (
          <p className="border-2 border-blood p-3 font-mono text-sm text-blood">
            {error}
          </p>
        )}
        <button
          onClick={startSetup}
          disabled={busy}
          className="brutal-btn brutal-btn-gold self-start"
        >
          {busy ? "..." : "ENABLE 2FA"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submitEnable} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
        <div className="border-2 border-gold bg-bone p-2 self-start">
          <img
            src={setup.qrDataUrl}
            alt="Scan with your authenticator app"
            width={192}
            height={192}
            className="block"
          />
        </div>
        <div className="flex flex-col gap-3 font-mono text-sm text-bone">
          <div>
            <p className="brutal-heading text-xs text-gold">STEP 1</p>
            <p className="mt-1">Scan the QR code with your authenticator app.</p>
          </div>
          <div>
            <p className="brutal-heading text-xs text-gold">MANUAL ENTRY</p>
            <code className="mt-1 block break-all border-2 border-smoke p-2 text-xs text-bone">
              {setup.secret}
            </code>
          </div>
          <div>
            <p className="brutal-heading text-xs text-gold">STEP 2</p>
            <p className="mt-1">Enter the 6-digit code it generates below.</p>
          </div>
        </div>
      </div>
      <input
        className="brutal-input text-center text-2xl tracking-[0.5em]"
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        autoFocus
      />
      {error && (
        <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="brutal-btn brutal-btn-gold"
        >
          {busy ? "..." : "CONFIRM & ENABLE"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSetup(null);
            setCode("");
            setError(null);
          }}
          className="brutal-btn"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

function DisableTwoFactor({ onDone }: { onDone: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitDisable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.post("/auth/2fa/disable", { code });
      await onDone();
      setCode("");
    } catch (e) {
      setError(errorMessage(e, "Invalid authenticator code."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitDisable} className="flex flex-col gap-4">
      <p className="font-mono text-sm text-bone md:text-base">
        Enter a current 6-digit code from your authenticator app to turn 2FA off.
      </p>
      <input
        className="brutal-input text-center text-2xl tracking-[0.5em]"
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
      />
      {error && (
        <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="brutal-btn brutal-btn-blood self-start"
      >
        {busy ? "..." : "DISABLE 2FA"}
      </button>
    </form>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "bone" | "gold" | "blood";
}) {
  const valueClass = tone === "gold" ? "text-gold" : tone === "blood" ? "text-blood" : "text-bone";
  return (
    <div className="border border-smoke p-4">
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">{label}</p>
      <p className={`brutal-heading mt-2 text-3xl ${valueClass}`}>{value}</p>
    </div>
  );
}

function dominantTribe(counts: Record<Tribe, number>): string {
  let top: Tribe | null = null;
  let max = 0;
  for (const [t, c] of Object.entries(counts) as [Tribe, number][]) {
    if (c > max) {
      top = t;
      max = c;
    }
  }
  return top ? top.toUpperCase() : "—";
}
