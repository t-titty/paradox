import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Rate-limit middlewares. All use the default in-memory store — single
 * instance only. To horizontally scale, swap for rate-limit-redis.
 *
 * Webhook routes are NOT rate limited; mount them before these on the app.
 */

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many auth attempts, slow down.", code: "rate_limited" },
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, slow down.", code: "rate_limited" },
});

/**
 * Oracle / AI-bound routes: 20/hr. Keyed on userId once requireAuth has run,
 * else falls back to IP. Mount *after* requireAuth in the router.
 */
export const oracleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as unknown as { userId?: string }).userId;
    if (userId) return userId;
    // Route IPv6 requests through ipKeyGenerator so different addresses in
    // the same /56 subnet share a bucket — otherwise a single client could
    // trivially bypass the limit by cycling its IPv6 suffix.
    return ipKeyGenerator(req.ip ?? "unknown");
  },
  message: {
    message: "Too many Oracle requests this hour.",
    code: "rate_limited_oracle",
  },
});
