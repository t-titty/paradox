import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api.ts";
import type { Tribe } from "../lib/types.ts";
import { TRIBE_LABEL, TRIBE_ORDER } from "../lib/tribes.ts";

interface DashboardData {
  today: {
    date: string;
    paradox: { id: string; title: string } | null;
    vowedCount: number;
    split: { A: number; B: number };
    tribeSpread: Partial<Record<Tribe, number>>;
  };
  members: {
    userId: string;
    username: string;
    role: string;
    civilityScore: number;
    wisdomPoints: number;
    vows7: number;
    vows30: number;
    latestTribe: Tribe | null;
    streak: number;
    goldStars: number;
    redFlags: number;
  }[];
  duels: {
    id: string;
    paradoxTitle: string;
    startedAt: string;
    bothSigned: boolean;
    synthesisText: string | null;
    players: [string, string];
    transcript: { id: string; username: string; text: string; mode: string; redacted?: boolean }[];
  }[];
}

/**
 * Teacher / manager view of a circle: who's participating, how the class
 * split today, and transcripts of duels between classmates.
 */
export function CircleDashboard({ circleId }: { circleId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>(`/circles/${circleId}/dashboard`)
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e, "Could not load the dashboard.")));
  }, [circleId]);

  if (error) return <p className="font-mono text-sm text-blood">{error}</p>;
  if (!data) return <p className="brutal-heading text-muted">LOADING DASHBOARD...</p>;

  const spreadTotal = Object.values(data.today.tribeSpread).reduce((a, b) => a + (b ?? 0), 0) || 1;
  const students = data.members.filter((m) => m.role === "MEMBER");
  const participating = students.filter((m) => m.vows7 > 0).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-smoke pb-3">
        <h2 className="brutal-heading text-xl text-bone md:text-2xl">TEACHER DASHBOARD</h2>
        <Link to="/lesson-plans" className="font-mono text-xs uppercase tracking-brutal text-gold underline">
          LESSON PLANS →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="VOWED TODAY" value={`${data.today.vowedCount}/${data.members.length}`} />
        <Tile label="ACTIVE THIS WEEK" value={`${participating}/${students.length || data.members.length}`} />
        <Tile
          label="TODAY'S SPLIT"
          value={data.today.vowedCount ? `A ${data.today.split.A} · B ${data.today.split.B}` : "—"}
        />
        <Tile label="CLASS DUELS" value={String(data.duels.length)} />
      </div>

      {data.today.paradox && (
        <div className="border-2 border-smoke p-4">
          <p className="font-mono text-xs uppercase tracking-brutal text-muted">
            TODAY · {data.today.paradox.title.toUpperCase()} · TRIBE SPREAD
          </p>
          <div className="mt-3 flex flex-col gap-1">
            {TRIBE_ORDER.map((t) => {
              const n = data.today.tribeSpread[t] ?? 0;
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-36 font-mono text-[11px] uppercase text-bone">{TRIBE_LABEL[t]}</span>
                  <div className="h-3 flex-1 border border-smoke">
                    <div className="h-full bg-gold" style={{ width: `${(n / spreadTotal) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-[11px] text-muted">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto border-2 border-smoke">
        <table className="w-full min-w-[640px] font-mono text-xs">
          <thead className="text-left uppercase tracking-brutal text-muted">
            <tr className="border-b border-smoke">
              <th className="p-2">PLAYER</th>
              <th className="p-2">VOWS 7D</th>
              <th className="p-2">VOWS 30D</th>
              <th className="p-2">STREAK</th>
              <th className="p-2">LATEST TRIBE</th>
              <th className="p-2">★ / ⚑</th>
              <th className="p-2">CIVILITY</th>
            </tr>
          </thead>
          <tbody>
            {data.members.map((m) => (
              <tr key={m.userId} className="border-b border-smoke text-bone">
                <td className="p-2">
                  {m.username}
                  {m.role !== "MEMBER" && <span className="ml-2 text-muted">{m.role}</span>}
                </td>
                <td className="p-2">{m.vows7}</td>
                <td className="p-2">{m.vows30}</td>
                <td className="p-2">{m.streak}</td>
                <td className="p-2">{m.latestTribe ? TRIBE_LABEL[m.latestTribe] : "—"}</td>
                <td className="p-2">
                  <span className="text-gold">{m.goldStars}</span> / <span className="text-blood">{m.redFlags}</span>
                </td>
                <td className={`p-2 ${m.civilityScore < 40 ? "text-blood" : ""}`}>{m.civilityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <p className="brutal-heading text-sm text-muted">CLASSROOM DUELS</p>
        {data.duels.length === 0 && (
          <p className="font-mono text-sm text-muted">No duels between members yet.</p>
        )}
        {data.duels.map((d) => (
          <details key={d.id} className="border border-smoke p-3">
            <summary className="cursor-pointer font-mono text-xs uppercase tracking-brutal text-bone">
              {d.players[0]} vs {d.players[1]} · {d.paradoxTitle} · {new Date(d.startedAt).toLocaleDateString()}
              {d.bothSigned && <span className="ml-2 text-gold">· BRIDGE SIGNED</span>}
            </summary>
            <div className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto font-mono text-xs">
              {d.transcript.map((m) => (
                <p key={m.id} className={m.redacted ? "text-blood" : "text-bone"}>
                  <span className="text-muted">[{m.mode}] {m.username}:</span> {m.text}
                  {m.redacted && " (REDACTED — PERSONAL ATTACK)"}
                </p>
              ))}
              {d.synthesisText && <p className="mt-2 text-gold">SYNTHESIS: {d.synthesisText}</p>}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-bone p-3">
      <p className="font-mono text-[10px] uppercase tracking-brutal text-muted">{label}</p>
      <p className="brutal-heading mt-1 text-xl text-gold">{value}</p>
    </div>
  );
}
