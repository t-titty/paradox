import { useEffect, useState } from "react";
import type { DuelMessageDTO } from "../../../lib/duelTypes.ts";

interface Props {
  message: DuelMessageDTO;
  isSelf: boolean;
}

/**
 * One chat bubble. Renders fallacy and strong-logic markers inline.
 *
 * Ad hominem is a special case: the text is greyed out for 10 seconds after
 * the verdict arrives (per spec). We use the first time we see the verdict
 * as t=0; if the message arrives already-verdicted (e.g. on reconnect), we
 * skip the animation.
 */
export function Message({ message, isSelf }: Props) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (message.verdict?.kind === "fallacy" && message.verdict.fallacyType === "ad_hominem") {
      // Only mute if the verdict is fresh — detect via sentAt within last 30s.
      const age = Date.now() - new Date(message.sentAt).getTime();
      if (age < 30_000) {
        setMuted(true);
        const t = setTimeout(() => setMuted(false), 10_000);
        return () => clearTimeout(t);
      }
    }
  }, [message.verdict, message.sentAt]);

  const align = isSelf ? "items-end" : "items-start";
  const bubbleBorder = isSelf ? "border-bone" : "border-smoke";

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
          muted ? "opacity-20" : "opacity-100"
        } transition-opacity duration-200`}
      >
        {message.text}
      </div>
      {muted && (
        <p className="font-mono text-xs uppercase tracking-brutal text-blood">
          AD HOMINEM DETECTED · HIDDEN FOR 10 SECONDS
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
