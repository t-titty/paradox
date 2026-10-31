import type { DuelMessageDTO } from "../../../lib/duelTypes.ts";

interface Props {
  message: DuelMessageDTO;
  isSelf: boolean;
}

/**
 * One chat bubble. Renders fallacy and strong-logic markers inline.
 *
 * Ad hominem is redacted server-side: the opponent receives an empty text
 * and only ever sees a redaction mark. The author sees their own message
 * greyed out with a note that it never reached the other side.
 */
export function Message({ message, isSelf }: Props) {
  const align = isSelf ? "items-end" : "items-start";
  const bubbleBorder = isSelf ? "border-bone" : "border-smoke";

  if (message.redacted && !isSelf) {
    return (
      <div className={`flex flex-col gap-1 ${align}`}>
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-brutal text-muted">
          <span className="text-bone">{message.username}</span>
          <span>·</span>
          <span>{fmtTime(message.sentAt)}</span>
        </div>
        <div className="max-w-2xl border-2 border-dashed border-blood bg-ink px-4 py-3 font-mono text-sm uppercase tracking-brutal text-blood">
          ▇▇▇▇ REDACTED BY THE ORACLE · PERSONAL ATTACK ▇▇▇▇
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-brutal text-muted">
        <span className={isSelf ? "text-gold" : "text-bone"}>{message.username}</span>
        <span>·</span>
        <span>{fmtTime(message.sentAt)}</span>
        <VerdictMarker message={message} />
      </div>
      <div
        className={`max-w-2xl border-2 ${bubbleBorder} bg-ink px-4 py-3 font-mono text-bone ${
          message.redacted ? "line-through opacity-30" : "opacity-100"
        } transition-opacity duration-200`}
      >
        {message.text}
      </div>
      {message.redacted && (
        <p className="font-mono text-xs uppercase tracking-brutal text-blood">
          AD HOMINEM · YOUR OPPONENT NEVER SAW THIS · −10 CIVILITY
        </p>
      )}
      {message.verdict && message.verdict.kind !== "clean" && message.verdict.explanation && !message.redacted && (
        <p
          className={`max-w-2xl font-mono text-[11px] ${
            message.verdict.kind === "fallacy" ? "text-blood" : "text-gold"
          }`}
        >
          ORACLE: {message.verdict.explanation}
        </p>
      )}
    </div>
  );
}

function VerdictMarker({ message }: { message: DuelMessageDTO }) {
  if (!message.verdict) return null;
  if (message.verdict.kind === "clean") return null;

  if (message.verdict.kind === "fallacy") {
    const title = message.verdict.fallacyType.toUpperCase().replace(/_/g, " ");
    return (
      <span
        className="inline-flex items-center gap-1 border border-blood px-2 py-0.5 text-[10px] text-blood"
        title={`${title}: ${message.verdict.explanation}`}
      >
        ⚑ {title}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 border border-gold px-2 py-0.5 text-[10px] text-gold"
      title={message.verdict.explanation}
    >
      ★ STRONG LOGIC
    </span>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
