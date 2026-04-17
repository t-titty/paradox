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
import { errorHandler } from "./middleware/error.js";
import { createSocketServer } from "./sockets/index.js";

const app = express();

app.use(cors());
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

// In production, serve the built client from the same origin. The client
// is built to client/dist; at runtime this file is server/dist/index.js,
// so the path is ../../client/dist.
if (env.NODE_ENV === "production") {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(here, "../../client/dist");
  app.use(express.static(clientDist));
  // SPA fallback. Anything that isn't an /api or /socket.io request falls
  // through to index.html so client-side routes work on refresh.
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

async function shutdown(signal: string) {
  console.log(`[paradox] ${signal} received, shutting down`);
  httpServer.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
