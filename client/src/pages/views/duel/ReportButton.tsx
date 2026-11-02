import { useState } from "react";

const REASONS: { key: string; label: string }[] = [
  { key: "harassment", label: "Harassment or bullying" },
  { key: "hate", label: "Hate or slurs" },
  { key: "sexual", label: "Sexual content" },
  { key: "spam", label: "Spam or trolling" },
  { key: "other", label: "Something else" },
];

/**
 * Small "report" affordance for the duel room and post-duel screen. Sends a
 * report with the duel transcript to the moderation queue.
 */
export function ReportButton({ onReport }: { onReport: (reason: string, note?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("harassment");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return <span className="font-mono text-[10px] uppercase tracking-brutal text-muted">REPORTED</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] uppercase tracking-brutal text-muted underline hover:text-blood"
      >
        REPORT
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-4 md:items-center">
      <div className="w-full max-w-md border-2 border-blood bg-ink p-5">
        <p className="brutal-heading text-sm text-blood">REPORT YOUR OPPONENT</p>
        <p className="mt-2 font-mono text-xs text-muted">
          A moderator will read this duel's transcript. Reports are private.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {REASONS.map((r) => (
            <label key={r.key} className="flex items-center gap-3 font-mono text-sm text-bone">
              <input
                type="radio"
                name="report-reason"
                value={r.key}
                checked={reason === r.key}
                onChange={() => setReason(r.key)}
              />
              {r.label}
            </label>
          ))}
        </div>
        <textarea
          className="brutal-input mt-4 min-h-[70px] w-full resize-none text-sm"
          placeholder="Anything we should know? (optional)"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="brutal-btn brutal-btn-blood flex-1"
            onClick={() => {
              onReport(reason, note.trim() || undefined);
              setSent(true);
              setOpen(false);
            }}
          >
            SEND REPORT
          </button>
          <button type="button" className="brutal-btn flex-1" onClick={() => setOpen(false)}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
