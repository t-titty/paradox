import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { currentPermission, enablePush, pushSupported } from "../lib/push.ts";

const DISMISS_KEY = "paradox.notificationPrompt.dismissedAt";

/**
 * Post-login permission prompt. Shown once per browser per user session
 * when:
 *   - push is supported,
 *   - the user is signed in,
 *   - `Notification.permission === "default"` (never asked yet), and
 *   - the user hasn't clicked "Maybe Later" (sticky per browser).
 *
 * The Allow button triggers the *browser's* permission dialog via
 * `Notification.requestPermission()` inside `enablePush()`, so this UI
 * is a soft pre-prompt rather than a nag wrapped around the OS prompt.
 */
export function NotificationPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }
    if (!pushSupported()) return;
    if (currentPermission() !== "default") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, [user]);

  if (!visible) return null;

  async function onAllow() {
    setBusy(true);
    try {
      await enablePush();
    } finally {
      setBusy(false);
      setVisible(false);
    }
  }

  function onLater() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:pb-6">
      <div className="brutal-card-gold w-full max-w-xl">
        <p className="brutal-heading text-sm text-gold">STAY IN THE LOOP.</p>
        <p className="mt-3 font-mono text-sm text-bone md:text-base">
          Get notified when the Drop lands, the Vow opens, and the Duel
          begins. No spam.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAllow}
            disabled={busy}
            className="brutal-btn brutal-btn-gold"
          >
            {busy ? "..." : "ALLOW"}
          </button>
          <button
            type="button"
            onClick={onLater}
            disabled={busy}
            className="brutal-btn"
          >
            MAYBE LATER
          </button>
        </div>
      </div>
    </div>
  );
}
