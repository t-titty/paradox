import { createServer } from "node:http";
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
  res.json({ ok: true, env: env.NODE_ENV });
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
