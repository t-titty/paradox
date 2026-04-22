import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, ymd } from "../phases.js";
import {
  TEST_MODE_SETTING_KEY,
  systemTestModeEnabled,
} from "../lib/testMode.js";

export const adminRouter = Router();

// Every admin endpoint is gated. Non-admins (including un-authed requests)
// get 404 so the surface is invisible.
adminRouter.use(requireAdmin);

// ──────────────────────────────────────────────────────────────────────────
// Stats dashboard
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalUsers, votesToday, activeDuels, synthesesSigned, pendingSubmissions, totalFeedback] =
      await Promise.all([
        prisma.user.count(),
        prisma.vote.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.duel.count({ where: { endedAt: null, declinedAt: null } }),
        prisma.duel.count({ where: { bothSigned: true } }),
        prisma.submittedParadox.count({ where: { status: "pending" } }),
        prisma.feedback.count(),
      ]);

    res.json({
      stats: {
        totalUsers,
        votesToday,
        activeDuels,
        synthesesSigned,
        pendingSubmissions,
        totalFeedback,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Paradox CRUD
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/paradoxes", async (_req, res, next) => {
  try {
    const paradoxes = await prisma.paradox.findMany({
      orderBy: [{ airDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        optionA: true,
        optionB: true,
        category: true,
        airDate: true,
        createdAt: true,
      },
    });
    res.json({ paradoxes });
  } catch (e) {
    next(e);
  }
});

const paradoxInput = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(2).max(2000),
  optionA: z.string().min(1).max(500),
  optionB: z.string().min(1).max(500),
  category: z.string().min(2).max(80),
  // YYYY-MM-DD or null/empty to unschedule.
  airDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

adminRouter.post("/paradoxes", async (req, res, next) => {
  try {
    const body = paradoxInput.parse(req.body);
    const airDate = body.airDate ? parseYmd(body.airDate) : null;

    if (airDate) {
      const clash = await prisma.paradox.findUnique({ where: { airDate } });
      if (clash) throw new HttpError(409, "A paradox is already scheduled on that date", "conflict");
    }

    const row = await prisma.paradox.create({
      data: {
        title: body.title,
        description: body.description,
        optionA: body.optionA,
        optionB: body.optionB,
        category: body.category,
        airDate,
      },
    });
    res.status(201).json({ paradox: row });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/paradoxes/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = paradoxInput.parse(req.body);
    const airDate = body.airDate ? parseYmd(body.airDate) : null;

    if (airDate) {
      const clash = await prisma.paradox.findUnique({ where: { airDate } });
      if (clash && clash.id !== id) {
        throw new HttpError(409, "A paradox is already scheduled on that date", "conflict");
      }
    }

    const row = await prisma.paradox.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        optionA: body.optionA,
        optionB: body.optionB,
        category: body.category,
        airDate,
      },
    });
    res.json({ paradox: row });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/paradoxes/:id", async (req, res, next) => {
  try {
    await prisma.paradox.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Submissions (user-proposed paradoxes)
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/submissions", async (_req, res, next) => {
  try {
    const submissions = await prisma.submittedParadox.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { user: { select: { username: true } } },
    });
    res.json({ submissions });
  } catch (e) {
    next(e);
  }
});

// Find the next free airDate after today. Needed when approving submissions
// that should automatically be scheduled.
async function nextFreeAirDate(): Promise<Date> {
  const latest = await prisma.paradox.findFirst({
    where: { airDate: { not: null } },
    orderBy: { airDate: "desc" },
    select: { airDate: true },
  });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const base = latest?.airDate ?? start;
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  if (next < start) {
    return start;
  }
  return next;
}

adminRouter.post("/submissions/:id/approve", async (req, res, next) => {
  try {
    const id = req.params.id;
    const submission = await prisma.submittedParadox.findUnique({ where: { id } });
    if (!submission) throw new HttpError(404, "Submission not found", "not_found");
    if (submission.status !== "pending") {
      throw new HttpError(409, "Submission already reviewed", "conflict");
    }

    const airDate = await nextFreeAirDate();
    const created = await prisma.paradox.create({
      data: {
        title: submission.title,
        description: submission.description,
        optionA: submission.optionA,
        optionB: submission.optionB,
        category: submission.category,
        airDate,
        submittedById: submission.userId,
      },
    });
    await prisma.submittedParadox.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        scheduledFor: airDate,
        paradoxId: created.id,
      },
    });
    res.json({ paradox: created, scheduledFor: ymd(airDate) });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/submissions/:id/reject", async (req, res, next) => {
  try {
    const id = req.params.id;
    const submission = await prisma.submittedParadox.findUnique({ where: { id } });
    if (!submission) throw new HttpError(404, "Submission not found", "not_found");
    if (submission.status !== "pending") {
      throw new HttpError(409, "Submission already reviewed", "conflict");
    }
    const updated = await prisma.submittedParadox.update({
      where: { id },
      data: { status: "rejected", reviewedAt: new Date() },
    });
    res.json({ submission: updated });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Feedback
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/feedback", async (_req, res, next) => {
  try {
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });
    res.json({ feedback });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        wisdomPoints: true,
        civilityScore: true,
        isPremium: true,
        isAdmin: true,
        isBanned: true,
        isGrantedCircleAccess: true,
        testMode: true,
        createdAt: true,
        tribeHistory: {
          orderBy: { airDate: "desc" },
          take: 10,
          select: { tribe: true, airDate: true },
        },
      },
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/users/:id/reset-civility", async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { civilityScore: 100 },
      select: { id: true, username: true, civilityScore: true },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

const banSchema = z.object({ banned: z.boolean() });

adminRouter.post("/users/:id/ban", async (req, res, next) => {
  try {
    const { banned } = banSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: banned },
      select: { id: true, username: true, isBanned: true },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

const grantCircleAccessSchema = z.object({ granted: z.boolean() });

/**
 * Admin toggle for the Circle creation paywall. Lets us comp beta/testing
 * accounts without routing them through Stripe.
 */
adminRouter.post("/users/:id/grant-circle-access", async (req, res, next) => {
  try {
    const { granted } = grantCircleAccessSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isGrantedCircleAccess: granted },
      select: { id: true, username: true, isGrantedCircleAccess: true },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Developer Controls / System Settings
// ──────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/developer
 * Convenience view of developer-surfaced switches for the admin panel.
 * Currently just mirrors the SystemSetting.TEST_MODE value so the panel
 * can render its toggle without a separate settings fetch.
 */
adminRouter.get("/developer", async (_req, res, next) => {
  try {
    const systemTestMode = await systemTestModeEnabled();
    res.json({ systemTestMode });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/settings
 * Return every SystemSetting row. Small table by design (operator toggles,
 * not user data), so no pagination. Values are strings — callers parse per
 * setting.
 */
adminRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
      select: { key: true, value: true, updatedAt: true },
    });
    res.json({ settings });
  } catch (e) {
    next(e);
  }
});

// Whitelist of keys that may be written through the admin API. Blocks
// arbitrary key creation that would accumulate into a cluttered table.
const ALLOWED_SETTING_KEYS = [TEST_MODE_SETTING_KEY] as const;

const settingUpsertSchema = z.object({
  key: z.enum(ALLOWED_SETTING_KEYS),
  value: z.string().min(1).max(200),
});

/**
 * POST /api/admin/settings
 * Upsert a SystemSetting by key. Only keys in `ALLOWED_SETTING_KEYS` are
 * accepted — new settings need a code change so the client knows how to
 * render and interpret them.
 */
adminRouter.post("/settings", async (req, res, next) => {
  try {
    const { key, value } = settingUpsertSchema.parse(req.body);
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
      select: { key: true, value: true, updatedAt: true },
    });
    res.json({ setting });
  } catch (e) {
    next(e);
  }
});
