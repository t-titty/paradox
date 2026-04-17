import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { Constellation } from "../components/Constellation.tsx";
import { TribeBarChart } from "../components/TribeBarChart.tsx";
import { FlashbackCard } from "../components/FlashbackCard.tsx";
import type { Choice, Tribe } from "../lib/types.ts";

interface ProfileData {
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
  const { user: me } = useAuth();
  const username = params.username ?? me?.username ?? "";
  const isSelf = me?.username === username;

  const [data, setData] = useState<ProfileData | null>(null);
  const [flashback, setFlashback] = useState<FlashbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [username]);

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

  const { user, history, tribeCounts, constellation } = data;
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
          {user.isPremium && <span className="ml-3 text-gold">· PREMIUM</span>}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="WISDOM POINTS" value={String(user.wisdomPoints)} tone="gold" />
        <Stat
          label="CIVILITY"
          value={`${user.civilityScore}/100`}
          tone={user.civilityScore < 40 ? "blood" : user.civilityScore < 70 ? "bone" : "gold"}
        />
        <Stat label="DUELS LOGGED" value={String(history.length)} tone="bone" />
        <Stat
          label="DOMINANT TRIBE"
          value={dominantTribe(tribeCounts)}
          tone="bone"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="brutal-heading text-sm text-muted">CONSTELLATION</h2>
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
    </div>
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
