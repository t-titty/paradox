import { api } from "./api.ts";

/**
 * Browser-side Push API wrapper. All functions are safe to call when the
 * browser doesn't support push or the user hasn't authed yet — they
 * resolve to null / false instead of throwing.
 */

const SW_URL = "/sw.js";

/** Base64-URL (what VAPID keys come in) → Uint8Array (what PushManager wants).
 *  Allocates a fresh ArrayBuffer explicitly so the returned Uint8Array is
 *  typed as `Uint8Array<ArrayBuffer>` — PushManager.subscribe refuses the
 *  wider `Uint8Array<ArrayBufferLike>` under TS 5.7+. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function currentPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_URL);
}

async function fetchPublicKey(): Promise<string | null> {
  // Build-time var first (zero round trips when set). Fall back to the
  // /public-key endpoint so a late-configured deploy works without a
  // client rebuild.
  const baked = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (baked && baked.length > 0) return baked;
  try {
    const { data } = await api.get<{ publicKey: string | null }>(
      "/notifications/public-key",
    );
    return data.publicKey;
  } catch {
    return null;
  }
}

/**
 * Ensure the browser is subscribed and the subscription is POSTed to our
 * server. Idempotent — returns the existing subscription if we're already
 * subscribed, creates a new one if not.
 */
export async function enablePush(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const publicKey = await fetchPublicKey();
  if (!publicKey) {
    console.warn("[push] VAPID public key unavailable — cannot subscribe");
    return null;
  }

  const reg = await getRegistration();
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  // Persist server-side. The endpoint is unique so re-subscribing a
  // browser that's already stored is a harmless upsert.
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    console.error("[push] browser returned an incomplete subscription");
    return null;
  }
  try {
    await api.post("/notifications/subscribe", {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
  } catch (err) {
    console.error("[push] server subscribe failed:", err);
  }
  return sub;
}

/**
 * Unsubscribe the browser and tell the server to drop the row. Safe to
 * call when we were never subscribed.
 */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    try {
      await api.delete("/notifications/unsubscribe", {
        data: { endpoint: sub.endpoint },
      });
    } catch {
      // Server may already have pruned the row. Not blocking.
    }
    await sub.unsubscribe().catch(() => {});
  } catch (err) {
    console.error("[push] disable failed:", err);
  }
}

/** True iff the browser has an active PushSubscription for this origin. */
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return sub !== null;
}
