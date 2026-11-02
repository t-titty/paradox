import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { env } from "./env.js";
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
import { notificationsRouter } from "./routes/notifications.js";
import { practiceRouter } from "./routes/practice.js";
import { streakRouter } from "./routes/streak.js";
import { publicRouter } from "./routes/public.js";
import { supportRouter } from "./routes/support.js";
import { registerSeoRoutes } from "./lib/seo.js";
import { errorHandler } from "./middleware/error.js";
import { createSocketServer } from "./sockets/index.js";
import { startNotificationScheduler } from "./lib/notificationScheduler.js";
import { startGameScheduler } from "./lib/gameScheduler.js";
import { recoverDuels } from "./sockets/duelRecovery.js";
import { markShuttingDown } from "./sockets/duel.js";
import { refreshClockOverride, startClockOverrideSync } from "./lib/clockOverride.js";

const app = express();

app.use(cors());

// Stripe webhooks require the raw request body for signature verification,
// so this route MUST be mounted before the global express.json() below.
app.use("/api/webhooks/stripe", stripeWebhookRouter);

app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV, testMode: env.TEST_MODE });
});

app.use("/api/auth", authRouter);
app.use("/api/paradox", paradoxRouter);
app.use("/api/vote", voteRouter);
app.use("/api/throwback", throwbackRouter);
app.use("/api/sort", sortRouter);
app.use("/api/archive", archiveRouter);
app.use("/api/profile", profileRouter);
app.use("/api/flashback", flashbackRouter);
app.use("/api/library", libraryRouter);
app.use("/api/circles", circlesRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/streak", streakRouter);
app.use("/api/public", publicRouter);
app.use("/api/support", supportRouter);

// In production, serve the built client from the same origin. The client
// is built to client/dist; at runtime this file is server/dist/index.js,
// so the path is ../../client/dist.
if (env.NODE_ENV === "production") {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(here, "../../client/dist");
  // Public pages get real <title>/Open Graph tags for crawlers and link
  // previews, plus robots.txt and a sitemap. Must precede the static/SPA
  // handlers below.
  registerSeoRoutes(app, path.join(clientDist, "index.html"));
  app.use(express.static(clientDist, { index: false }));
  app.get("/", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
  // SPA fallback. Anything that isn't an /api or /socket.io request falls
  // through to index.html so client-side routes work on refresh.
  app.get(/^\/(?!api\/|socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

const httpServer = createServer(app);
const io = createSocketServer(httpServer);

// Rebuild any duels that were live when the previous process stopped,
// *before* accepting connections so reconnecting players land back in them.
refreshClockOverride()
  .catch(() => undefined)
  .then(() => recoverDuels(io))
  .catch((e) => console.error("[paradox] duel recovery failed:", e))
  .finally(() => {
    httpServer.listen(env.PORT, () => {
      console.log(`[paradox] listening on :${env.PORT} (${env.NODE_ENV}) · game clock ${env.PHASE_TIMEZONE}`);
      // Push scheduler self-disables when VAPID isn't configured.
      startNotificationScheduler();
      startGameScheduler();
      startClockOverrideSync();
    });
  });

let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(`[paradox] ${signal} received, shutting down`);
  // Live duels are checkpointed; the next process recovers them. Drop every
  // socket now (without treating it as players leaving) so clients reconnect
  // to the new instance instead of lingering on this one.
  markShuttingDown();
  const force = setTimeout(() => process.exit(0), 5000);
  force.unref();
  io.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
