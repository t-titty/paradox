import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { api, errorMessage } from "../lib/api.ts";

type Tab = "stats" | "paradoxes" | "submissions" | "feedback" | "users";

interface Stats {
  totalUsers: number;
  votesToday: number;
  activeDuels: number;
  synthesesSigned: number;
  pendingSubmissions: number;
  totalFeedback: number;
}

interface ParadoxRow {
  id: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
  airDate: string | null;
  createdAt: string;
}

type SubStatus = "pending" | "approved" | "rejected";
interface SubmissionRow {
  id: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
  reason: string;
  status: SubStatus;
  createdAt: string;
  scheduledFor: string | null;
  user: { username: string };
}

interface FeedbackRow {
  id: string;
  category: string;
  message: string;
  createdAt: string;
  user: { username: string };
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  wisdomPoints: number;
  civilityScore: number;
  isPremium: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  tribeHistory: { tribe: string; airDate: string }[];
}

export function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");

  if (loading) return null;
  // Return a visual 404 for anyone who isn't an admin — matches the server's
  // 404 response so the surface stays invisible.
  if (!user || !user.isAdmin) {
    return <NotFound />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:px-6 md:py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-brutal text-blood">RESTRICTED</p>
        <h1 className="brutal-heading mt-3 text-4xl text-bone md:text-6xl">ADMIN PANEL.</h1>
        <p className="mt-4 max-w-2xl font-mono text-base text-muted">
          You can see this because <span className="text-bone">{user.username}</span> is flagged as
          admin. Changes here hit production immediately.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b-2 border-smoke pb-2">
        <TabBtn active={tab === "stats"} onClick={() => setTab("stats")}>STATS</TabBtn>
        <TabBtn active={tab === "paradoxes"} onClick={() => setTab("paradoxes")}>PARADOXES</TabBtn>
        <TabBtn active={tab === "submissions"} onClick={() => setTab("submissions")}>SUBMISSIONS</TabBtn>
        <TabBtn active={tab === "feedback"} onClick={() => setTab("feedback")}>FEEDBACK</TabBtn>
        <TabBtn active={tab === "users"} onClick={() => setTab("users")}>USERS</TabBtn>
      </nav>

      {tab === "stats" && <StatsPanel />}
      {tab === "paradoxes" && <ParadoxesPanel />}
      {tab === "submissions" && <SubmissionsPanel />}
      {tab === "feedback" && <FeedbackPanel />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="brutal-heading text-sm text-muted">404</p>
      <h1 className="brutal-heading text-5xl text-bone md:text-7xl">NOT FOUND.</h1>
      <p className="font-mono text-muted">The page you requested does not exist.</p>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 px-4 py-2 font-mono text-xs uppercase tracking-brutal ${
        active
          ? "border-gold bg-gold text-ink"
          : "border-smoke text-muted hover:border-bone hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return <p className="border-2 border-blood p-3 font-mono text-sm text-blood">{children}</p>;
}

// ─────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────

function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ stats: Stats }>("/admin/stats")
      .then((r) => setStats(r.data.stats))
      .catch((e) => setErr(errorMessage(e, "Could not load stats.")));
  }, []);

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!stats) return <p className="brutal-heading text-muted">LOADING...</p>;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <StatCard label="TOTAL USERS" value={stats.totalUsers} />
      <StatCard label="VOTES TODAY" value={stats.votesToday} />
      <StatCard label="ACTIVE DUELS" value={stats.activeDuels} />
      <StatCard label="SYNTHESES SIGNED" value={stats.synthesesSigned} />
      <StatCard label="PENDING SUBMISSIONS" value={stats.pendingSubmissions} />
      <StatCard label="TOTAL FEEDBACK" value={stats.totalFeedback} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-bone p-4">
      <p className="font-mono text-xs uppercase tracking-brutal text-muted">{label}</p>
      <p className="brutal-heading mt-2 text-4xl text-gold">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PARADOXES
// ─────────────────────────────────────────────────────────────────────────

function ParadoxesPanel() {
  const [rows, setRows] = useState<ParadoxRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<ParadoxRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ paradoxes: ParadoxRow[] }>("/admin/paradoxes")
      .then((r) => setRows(r.data.paradoxes))
      .catch((e) => setErr(errorMessage(e, "Could not load paradoxes.")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this paradox? Votes and duels referencing it will be removed.")) return;
    try {
      await api.delete(`/admin/paradoxes/${id}`);
      load();
    } catch (e) {
      setErr(errorMessage(e, "Delete failed."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          {rows?.length ?? 0} SCHEDULED
        </p>
        <button className="brutal-btn brutal-btn-gold" onClick={() => setCreating(true)}>
          + NEW PARADOX
        </button>
      </div>

      {err && <ErrorBox>{err}</ErrorBox>}

      {creating && (
        <ParadoxForm
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {editing && (
        <ParadoxForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {!rows ? (
        <p className="brutal-heading text-muted">LOADING...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((p) => (
            <article key={p.id} className="border-2 border-bone p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs uppercase tracking-brutal text-muted">
                    {p.category} · {p.airDate ? p.airDate.slice(0, 10) : "UNSCHEDULED"}
                  </p>
                  <h3 className="brutal-heading mt-1 text-xl text-bone">{p.title.toUpperCase()}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="brutal-btn" onClick={() => setEditing(p)}>EDIT</button>
                  <button
                    className="brutal-btn brutal-btn-blood"
                    onClick={() => remove(p.id)}
                  >
                    DELETE
                  </button>
                </div>
              </div>
              <p className="mt-3 font-mono text-sm text-muted">{p.description}</p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <p className="border border-smoke p-2 font-mono text-sm text-bone">A: {p.optionA}</p>
                <p className="border border-smoke p-2 font-mono text-sm text-bone">B: {p.optionB}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ParadoxForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: ParadoxRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [optionA, setOptionA] = useState(initial?.optionA ?? "");
  const [optionB, setOptionB] = useState(initial?.optionB ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [airDate, setAirDate] = useState(initial?.airDate ? initial.airDate.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        category: category.trim(),
        airDate: airDate ? airDate : null,
      };
      if (initial) {
        await api.put(`/admin/paradoxes/${initial.id}`, body);
      } else {
        await api.post(`/admin/paradoxes`, body);
      }
      onSaved();
    } catch (e) {
      setErr(errorMessage(e, "Save failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 border-2 border-gold p-4">
      <p className="brutal-heading text-sm text-gold">{initial ? "EDIT" : "NEW"} PARADOX</p>
      <FormField label="TITLE">
        <input className="brutal-input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </FormField>
      <FormField label="DESCRIPTION">
        <textarea
          className="brutal-input min-h-[80px] resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={2000}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label="OPTION A">
          <input className="brutal-input" value={optionA} onChange={(e) => setOptionA(e.target.value)} required maxLength={500} />
        </FormField>
        <FormField label="OPTION B">
          <input className="brutal-input" value={optionB} onChange={(e) => setOptionB(e.target.value)} required maxLength={500} />
        </FormField>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label="CATEGORY">
          <input className="brutal-input" value={category} onChange={(e) => setCategory(e.target.value)} required maxLength={80} />
        </FormField>
        <FormField label="AIR DATE (YYYY-MM-DD · BLANK = UNSCHEDULED)">
          <input
            className="brutal-input"
            type="date"
            value={airDate}
            onChange={(e) => setAirDate(e.target.value)}
          />
        </FormField>
      </div>
      {err && <ErrorBox>{err}</ErrorBox>}
      <div className="flex gap-2">
        <button className="brutal-btn brutal-btn-gold" disabled={busy}>
          {busy ? "..." : "SAVE"}
        </button>
        <button type="button" className="brutal-btn" onClick={onCancel} disabled={busy}>
          CANCEL
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="brutal-heading text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────

function SubmissionsPanel() {
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<{ submissions: SubmissionRow[] }>("/admin/submissions")
      .then((r) => setRows(r.data.submissions))
      .catch((e) => setErr(errorMessage(e, "Could not load submissions.")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    try {
      await api.post(`/admin/submissions/${id}/approve`);
      load();
    } catch (e) {
      setErr(errorMessage(e, "Approve failed."));
    }
  }

  async function reject(id: string) {
    if (!confirm("Reject this submission?")) return;
    try {
      await api.post(`/admin/submissions/${id}/reject`);
      load();
    } catch (e) {
      setErr(errorMessage(e, "Reject failed."));
    }
  }

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!rows) return <p className="brutal-heading text-muted">LOADING...</p>;
  if (rows.length === 0) {
    return <p className="font-mono text-sm text-muted">No submissions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((s) => (
        <article key={s.id} className="border-2 border-bone p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-brutal text-muted">
                {s.category} · FROM {s.user.username.toUpperCase()} ·{" "}
                {new Date(s.createdAt).toDateString().toUpperCase()}
              </p>
              <h3 className="brutal-heading mt-1 text-xl text-bone">{s.title.toUpperCase()}</h3>
            </div>
            <StatusBadge status={s.status} />
          </div>
          <p className="mt-3 font-mono text-sm text-bone">{s.description}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <p className="border border-smoke p-2 font-mono text-sm text-bone">A: {s.optionA}</p>
            <p className="border border-smoke p-2 font-mono text-sm text-bone">B: {s.optionB}</p>
          </div>
          <p className="mt-3 border-l-2 border-smoke pl-3 font-mono text-sm text-muted">
            <span className="text-gold">WHY:</span> {s.reason}
          </p>
          {s.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button className="brutal-btn brutal-btn-gold" onClick={() => approve(s.id)}>
                APPROVE
              </button>
              <button className="brutal-btn brutal-btn-blood" onClick={() => reject(s.id)}>
                REJECT
              </button>
            </div>
          )}
          {s.status === "approved" && s.scheduledFor && (
            <p className="mt-3 font-mono text-xs uppercase tracking-brutal text-gold">
              SCHEDULED FOR {s.scheduledFor.slice(0, 10)}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: SubStatus }) {
  const color =
    status === "approved" ? "border-gold text-gold" : status === "rejected" ? "border-blood text-blood" : "border-bone text-bone";
  return (
    <span className={`border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-brutal ${color}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────────────────────────────────

function FeedbackPanel() {
  const [rows, setRows] = useState<FeedbackRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ feedback: FeedbackRow[] }>("/admin/feedback")
      .then((r) => setRows(r.data.feedback))
      .catch((e) => setErr(errorMessage(e, "Could not load feedback.")));
  }, []);

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!rows) return <p className="brutal-heading text-muted">LOADING...</p>;
  if (rows.length === 0) {
    return <p className="font-mono text-sm text-muted">No feedback yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((f) => (
        <article key={f.id} className="border-2 border-bone p-4">
          <p className="font-mono text-xs uppercase tracking-brutal text-muted">
            {categoryLabel(f.category)} · {f.user.username.toUpperCase()} ·{" "}
            {new Date(f.createdAt).toDateString().toUpperCase()}
          </p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm text-bone">{f.message}</p>
        </article>
      ))}
    </div>
  );
}

function categoryLabel(c: string): string {
  if (c === "bug") return "BUG REPORT";
  if (c === "feature") return "FEATURE REQUEST";
  return "GENERAL FEEDBACK";
}

// ─────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────

function UsersPanel() {
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<{ users: AdminUser[] }>("/admin/users")
      .then((r) => setRows(r.data.users))
      .catch((e) => setErr(errorMessage(e, "Could not load users.")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resetCivility(id: string, name: string) {
    if (!confirm(`Reset ${name}'s civility to 100?`)) return;
    try {
      await api.post(`/admin/users/${id}/reset-civility`);
      load();
    } catch (e) {
      setErr(errorMessage(e, "Reset failed."));
    }
  }

  async function toggleBan(id: string, name: string, banned: boolean) {
    if (!confirm(banned ? `Ban ${name}?` : `Unban ${name}?`)) return;
    try {
      await api.post(`/admin/users/${id}/ban`, { banned });
      load();
    } catch (e) {
      setErr(errorMessage(e, "Ban toggle failed."));
    }
  }

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!rows) return <p className="brutal-heading text-muted">LOADING...</p>;

  return (
    <div className="overflow-x-auto border-2 border-bone">
      <table className="w-full font-mono text-sm">
        <thead className="border-b-2 border-bone bg-smoke/20">
          <tr className="text-left uppercase tracking-brutal">
            <th className="px-3 py-2 text-xs">USER</th>
            <th className="px-3 py-2 text-xs">WP</th>
            <th className="px-3 py-2 text-xs">CIV</th>
            <th className="px-3 py-2 text-xs">TRIBES</th>
            <th className="px-3 py-2 text-xs">STATUS</th>
            <th className="px-3 py-2 text-xs">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-smoke align-top">
              <td className="px-3 py-3">
                <p className="text-bone">{u.username}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </td>
              <td className="px-3 py-3 text-gold">{u.wisdomPoints}</td>
              <td className={`px-3 py-3 ${u.civilityScore < 40 ? "text-blood" : "text-bone"}`}>
                {u.civilityScore}
              </td>
              <td className="px-3 py-3">
                {u.tribeHistory.length === 0 ? (
                  <span className="text-muted">—</span>
                ) : (
                  <span className="text-xs text-muted">
                    {u.tribeHistory.map((t) => t.tribe).join(" · ")}
                  </span>
                )}
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {u.isAdmin && <Pill color="gold">ADMIN</Pill>}
                  {u.isPremium && <Pill color="gold">PREMIUM</Pill>}
                  {u.isBanned && <Pill color="blood">BANNED</Pill>}
                </div>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-col gap-1">
                  <button
                    className="border border-bone px-2 py-1 text-xs uppercase tracking-brutal hover:bg-bone hover:text-ink"
                    onClick={() => resetCivility(u.id, u.username)}
                  >
                    RESET CIV
                  </button>
                  <button
                    className={`border px-2 py-1 text-xs uppercase tracking-brutal ${
                      u.isBanned
                        ? "border-gold text-gold hover:bg-gold hover:text-ink"
                        : "border-blood text-blood hover:bg-blood hover:text-ink"
                    }`}
                    onClick={() => toggleBan(u.id, u.username, !u.isBanned)}
                  >
                    {u.isBanned ? "UNBAN" : "BAN"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pill({ color, children }: { color: "gold" | "blood"; children: React.ReactNode }) {
  const cls = color === "gold" ? "border-gold text-gold" : "border-blood text-blood";
  return (
    <span className={`border px-1 py-[1px] text-[10px] uppercase tracking-brutal ${cls}`}>
      {children}
    </span>
  );
}

