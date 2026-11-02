import { useState } from "react";
import type { Tribe } from "../lib/types.ts";
import { TRIBE_GLYPH, TRIBE_LABEL } from "../lib/tribes.ts";

export interface ShareData {
  number: number | null;
  date: string;
  title: string;
  tribe: Tribe | null;
  sidePct: number;
  streak: number;
}

export function shareText(d: ShareData, url: string): string {
  const lines = [
    `PARADOX${d.number ? ` #${d.number}` : ""} — ${d.title}`,
    d.tribe ? `I'm a ${TRIBE_LABEL[d.tribe]} ${TRIBE_GLYPH[d.tribe]} · sided with ${d.sidePct}%` : `Sided with ${d.sidePct}%`,
  ];
  if (d.streak >= 2) lines.push(`🔥 ${d.streak}-day streak`);
  lines.push(url);
  return lines.join("\n");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

/** Render the 1080×1350 share image. */
export async function renderShareImage(d: ShareData): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gold = "#FFD700";
  const bone = "#F5F5F5";
  const muted = "#8A8A8A";
  const mono = '"IBM Plex Mono", ui-monospace, monospace';

  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = bone;
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.fillStyle = gold;
  ctx.font = `700 44px ${mono}`;
  ctx.fillText(`PARADOX${d.number ? ` #${d.number}` : ""}`, 100, 160);
  ctx.fillStyle = muted;
  ctx.font = `400 30px ${mono}`;
  ctx.fillText(d.date, 100, 210);

  ctx.fillStyle = bone;
  ctx.font = `700 72px ${mono}`;
  let y = 340;
  for (const line of wrap(ctx, d.title.toUpperCase(), W - 200).slice(0, 4)) {
    ctx.fillText(line, 100, y);
    y += 86;
  }

  y = Math.max(y + 60, 760);
  ctx.fillStyle = muted;
  ctx.font = `400 34px ${mono}`;
  ctx.fillText("THE ORACLE CALLS ME", 100, y);
  ctx.fillStyle = gold;
  ctx.font = `700 96px ${mono}`;
  ctx.fillText(d.tribe ? `${TRIBE_LABEL[d.tribe]} ${TRIBE_GLYPH[d.tribe]}` : "UNSORTED", 100, y + 110);

  ctx.fillStyle = bone;
  ctx.font = `500 44px ${mono}`;
  ctx.fillText(`SIDED WITH ${d.sidePct}% OF THE WORLD`, 100, y + 210);
  if (d.streak >= 2) ctx.fillText(`🔥 ${d.streak}-DAY STREAK`, 100, y + 280);

  ctx.fillStyle = muted;
  ctx.font = `400 30px ${mono}`;
  ctx.fillText("ONE DILEMMA. ONE SENTENCE. FIND YOUR OPPOSITE.", 100, H - 110);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/**
 * Wordle-style share: one tap shares an image + text through the native
 * share sheet; desktop falls back to copying the text and downloading the
 * image.
 */
export function ShareButton({ data, className = "" }: { data: ShareData; className?: string }) {
  const [state, setState] = useState<"idle" | "working" | "copied" | "shared">("idle");
  const url = `${window.location.origin}/p/${data.date}`;

  async function onShare() {
    setState("working");
    const text = shareText(data, url);
    try {
      const blob = await renderShareImage(data);
      const file = blob ? new File([blob], `paradox-${data.date}.png`, { type: "image/png" }) : null;
      const nav = navigator as Navigator & { canShare?: (d: object) => boolean };
      if (file && nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ text, files: [file] });
        setState("shared");
        return;
      }
      if (nav.share) {
        await nav.share({ text, url });
        setState("shared");
        return;
      }
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      if (blob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `paradox-${data.date}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
      setState("copied");
    } catch {
      // User dismissed the share sheet.
      setState("idle");
    }
  }

  return (
    <button onClick={onShare} className={`brutal-btn brutal-btn-gold ${className}`} disabled={state === "working"}>
      {state === "copied" ? "COPIED + SAVED ✓" : state === "shared" ? "SHARED ✓" : "SHARE YOUR RESULT"}
    </button>
  );
}
