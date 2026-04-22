/**
 * JWT blacklist for explicit logout. Stores each blacklisted token's jti
 * (or the raw token hash as a fallback) with its expiry — we evict lazily
 * when we see an expired entry.
 *
 * Single-process Map today. Before scaling to multiple instances this
 * needs to move behind Redis (ioredis, shared across instances) — otherwise
 * a token logged out on instance A still validates on instance B until its
 * JWT exp runs out.
 */

import crypto from "node:crypto";

interface Entry {
  // Absolute ms at which this entry can be purged.
  expiresAt: number;
}

const blacklist = new Map<string, Entry>();

function tokenKey(token: string): string {
  // We don't want to keep the raw JWT in memory (it contains a signature).
  // Hash first — collision risk at this volume is nil.
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Add a token to the blacklist. `expUnixSeconds` comes from the JWT's
 * `exp` claim — once that has passed, the token is invalid on its own.
 */
export function blacklistToken(token: string, expUnixSeconds: number): void {
  blacklist.set(tokenKey(token), { expiresAt: expUnixSeconds * 1000 });
}

export function isBlacklisted(token: string): boolean {
  const entry = blacklist.get(tokenKey(token));
  if (!entry) return false;
  if (entry.expiresAt <= Date.now()) {
    blacklist.delete(tokenKey(token));
    return false;
  }
  return true;
}

/**
 * Periodic cleanup — called from a timer in the server bootstrap.
 * Keeps the Map from growing unbounded even though individual checks also
 * prune lazily.
 */
export function sweep(): void {
  const now = Date.now();
  for (const [k, v] of blacklist.entries()) {
    if (v.expiresAt <= now) blacklist.delete(k);
  }
}
