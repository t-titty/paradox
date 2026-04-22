import { createServer } from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./env.js";
import { sweep as sweepTokenBlacklist } from "./lib/tokenBlacklist.js";
import { authLimiter, generalLimiter } from "./middleware/rateLimit.js";
import { prisma } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { paradoxRouter } from "./routes/paradox.js";
import { voteRouter } from "./routes/vote.js";
import { throwbackRouter } from "./routes/throwback.js";
import { sortRouter } from "./routes/sort.js";
import { archiveRouter } from "./routes/archive.js";
import { profileRouter } from "./routes/profile.js";
import { flashbackRouter } from "./routes/flashback.js";
import { libraryRouter } from "./routes/library.js";
import { circlesRouter } from "./routes/circles.js";
import { feedbackRouter } from "./routes/feedback.js";
import { submissionsRouter } from "./routes/submissions.js";
import { adminRouter } from "./routes/admin.js";
import { stripeRouter } from "./routes/stripe.js";
import { stripeWebhookRouter } from "./routes/stripeWebhook.js";
import { errorHandler } from "./middleware/error.js";
import { createSocketServer } from "./sockets/index.js";

const app = express();

// Trust Railway's (or other) edge proxy so req.ip reflects the real client
// and X-Forwarded-For is honored. `1` trusts exactly one hop — enough for
// our deployment topology, conservative for everything else.
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* ---------- security headers via helmet ----------
 *
 * CSP allows our own origin + Stripe (js, api, hosted checkout, webhooks).
 * Style/script stay `self`. Inline styles are permitted because Tailwind
 * occasionally emits inline styles (via arbitrary values) and because the
 * brutalist CSS layer uses a few element-level style attributes.
 *
 * `connect-src` includes `ws:` / `wss:` so socket.io can upgrade from
 * same-origin. `img-src data:` is needed for the 2FA QR code data URL.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        "connect-src": [
          "'self'",
          "https://api.stripe.com",
          "ws:",
          "wss:",
        ],
        "frame-src": [
          "'self'",
          "https://js.stripe.com",
          "https://hooks.stripe.com",
          "https://checkout.stripe.com",
        ],
        "img-src": ["'self'", "data:"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
        ],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'", "https://checkout.stripe.com"],
        "frame-ancestors": ["'none'"],
        "upgrade-insecure-requests": [],
      },
    },
    // Default X-Frame-Options: DENY — also enforced by frame-ancestors above.
    frameguard: { action: "deny" },
    // `strict-origin-when-cross-origin` is the sensible default for
    // cross-origin navigations (Stripe redirects back with Referer).
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Helmet's cross-origin embedder policy is too strict for hosted Stripe
    // Checkout's back-link to the SPA; leave it off.
    crossOriginEmbedderPolicy: false,
  }),
);

// Permissions-Policy: deny sensor/feature APIs the app doesn't use.
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()",
  );
  next();
});

/* ---------- CORS allowlist ---------- */
// Only origins listed in ALLOWED_ORIGINS can call /api/*. No wildcard.
// Requests with no Origin header (curl, same-origin) pass through.
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

/* Stripe webhooks require the raw request body for signature verification,
 * so this route MUST be mounted before the global express.json() below —
 * and BEFORE any rate limiter, so retries aren't throttled.
 */
app.use("/api/webhooks/stripe", stripeWebhookRouter);

app.use(express.json({ limit: "64kb" }));

// In production, resolve the built client path so both the static asset
// middleware (mounted next) and the SPA catch-all (mounted last) share it.
// Try several candidates because the runtime layout depends on where the
// process is started (Railway/Nixpacks runs from the repo root via the
// workspace script; locally we also run from /server). The first path that
// exists wins; if none do, clientDist stays null and the SPA routes no-op.
function resolveClientDist(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cwd = process.cwd();
  const candidates = [
    // Monorepo layout: server/dist/index.js → ../../client/dist
    path.resolve(here, "../../client/dist"),
    // Deeper nesting (some bundlers)
    path.resolve(here, "../../../client/dist"),
    // cwd is the repo root (Railway default)
    path.resolve(cwd, "client/dist"),
    // cwd is the server workspace
    path.resolve(cwd, "../client/dist"),
  ];
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, "index.html"))) return candidate;
  }
  return null;
}

const clientDist = env.NODE_ENV === "production" ? resolveClientDist() : null;
if (env.NODE_ENV === "production") {
  console.log(
    `[paradox] clientDist=${clientDist ?? "NOT FOUND"}` +
      ` (cwd=${process.cwd()}, __dirname=${path.dirname(fileURLToPath(import.meta.url))})`,
  );
}

// Serve hashed bundles (/assets/*) and other built files BEFORE any API
// routes or the catch-all, so express.static sets the right MIME type
// (text/css, application/javascript, etc.) and doesn't fall through to the
// error handler. `fallthrough: true` is the default — unknown paths still
// continue to the API routes below.
if (clientDist) {
  app.use(express.static(clientDist, { index: false }));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV, testMode: env.TEST_MODE });
});

// Tighter rate limit for auth routes (10/15m); general limiter (100/15m) on
// everything else. Oracle's per-user 20/hr limit is applied inside
// sortRouter, after requireAuth, so it can key on userId.
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/paradox", generalLimiter, paradoxRouter);
app.use("/api/vote", generalLimiter, voteRouter);
app.use("/api/throwback", generalLimiter, throwbackRouter);
app.use("/api/sort", generalLimiter, sortRouter);
app.use("/api/archive", generalLimiter, archiveRouter);
app.use("/api/profile", generalLimiter, profileRouter);
app.use("/api/flashback", generalLimiter, flashbackRouter);
app.use("/api/library", generalLimiter, libraryRouter);
app.use("/api/circles", generalLimiter, circlesRouter);
app.use("/api/stripe", generalLimiter, stripeRouter);
app.use("/api/feedback", generalLimiter, feedbackRouter);
app.use("/api/submissions", generalLimiter, submissionsRouter);
app.use("/api/admin", generalLimiter, adminRouter);

// SPA fallback. Anything that isn't an /api or /socket.io request falls
// through to index.html so client-side routes work on refresh.
if (clientDist) {
  app.get(/^\/(?!api\/|socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

const httpServer = createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[paradox] listening on :${env.PORT} (${env.NODE_ENV})`);
});

// Periodic sweep of expired entries in the in-memory JWT blacklist so the
// Map can't grow unbounded. Individual checks also prune lazily.
const BLACKLIST_SWEEP_MS = 10 * 60 * 1000;
setInterval(sweepTokenBlacklist, BLACKLIST_SWEEP_MS).unref();

async function shutdown(signal: string) {
  console.log(`[paradox] ${signal} received, shutting down`);
  httpServer.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
