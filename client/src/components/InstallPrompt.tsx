import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";

const DISMISS_KEY = "paradox.installPrompt.dismissedAt";
const NOTIF_DISMISS_KEY = "paradox.notificationPrompt.dismissedAt";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * "Add PARADOX to your home screen." Uses the browser's install prompt where
 * available (Chrome/Edge/Android) and shows Share → Add to Home Screen
 * instructions on iOS Safari. Waits until the push pre-prompt is out of the
 * way so the two never stack, and remembers a dismissal.
 */
export function InstallPrompt() {
  const { user } = useAuth();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    if (!user || isStandalone() || safeGet(DISMISS_KEY)) {
      setVisible(false);
      return;
    }
    const notifPending =
      "Notification" in window && Notification.permission === "default" && !safeGet(NOTIF_DISMISS_KEY);
    if (notifPending) return;
    setVisible(Boolean(deferred) || isIos());
  }, [user, deferred]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    dismiss();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 md:pb-6">
      <div className="w-full max-w-xl border-2 border-bone bg-ink p-4">
        <p className="brutal-heading text-sm text-gold">PUT PARADOX ON YOUR HOME SCREEN.</p>
        <p className="mt-2 font-mono text-sm text-bone">
          {deferred
            ? "One tap to open tomorrow's dilemma — no app store needed."
            : "In Safari, tap Share, then “Add to Home Screen”."}
        </p>
        <div className="mt-4 flex gap-3">
          {deferred && (
            <button onClick={install} className="brutal-btn brutal-btn-gold">
              INSTALL
            </button>
          )}
          <button onClick={dismiss} className="brutal-btn">
            {deferred ? "NOT NOW" : "GOT IT"}
          </button>
        </div>
      </div>
    </div>
  );
}
