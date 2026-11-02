import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { parseYmd, resolvePhase, ymd } from "../phases.js";
import { env } from "../env.js";
import {
  CLOCK_PHASES,
  refreshClockOverride,
  runtimeClockOverride,
  setClockOverride,
} from "../lib/clockOverride.js";
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

    const [totalUsers, votesToday, activeDuels, synthesesSigned, pendingSubmissions, totalFeedback, openReports] =
      await Promise.all([
        prisma.user.count({ where: { isBot: false } }),
        prisma.vote.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.duel.count({ where: { endedAt: null, declinedAt: null } }),
        prisma.duel.count({ where: { bothSigned: true } }),
        prisma.submittedParadox.count({ where: { status: "pending" } }),
        prisma.feedback.count(),
        prisma.duelReport.count({ where: { status: "open" } }),
      ]);

    res.json({
      stats: {
        totalUsers,
        votesToday,
        activeDuels,
        synthesesSigned,
        pendingSubmissions,
        totalFeedback,
        openReports,
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

// ──────────────────────────────────────────────────────────────────────────
// Late-Vow Grants
// ──────────────────────────────────────────────────────────────────────────

const lateVowGrantSchema = z.object({
  username: z.string().min(1).max(80),
  // YYYY-MM-DD — the airDate of the paradox to grant access to. Defaults
  // to today on the client; server still validates the format.
  paradoxDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/admin/late-vow-grants
 * Create (or re-affirm) a late-vow exemption for one user on one paradox.
 * Idempotent on (userId, paradoxId) via upsert — clicking "grant" twice
 * produces one row. The acting admin is recorded for audit.
 */
adminRouter.post("/late-vow-grants", async (req, res, next) => {
  try {
    const actingAdminId = (req as AuthedRequest).userId;
    const { username, paradoxDate } = lateVowGrantSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    });
    if (!user) throw new HttpError(404, "User not found", "user_not_found");

    const airDate = parseYmd(paradoxDate);
    const paradox = await prisma.paradox.findUnique({
      where: { airDate },
      select: { id: true, title: true, airDate: true },
    });
    if (!paradox) {
      throw new HttpError(
        404,
        `No paradox scheduled for ${paradoxDate}.`,
        "paradox_not_found",
      );
    }

    const grant = await prisma.lateVowGrant.upsert({
      where: {
        userId_paradoxId: { userId: user.id, paradoxId: paradox.id },
      },
      create: {
        userId: user.id,
        paradoxId: paradox.id,
        grantedByAdminId: actingAdminId,
      },
      // Preserve createdAt / grantedByAdminId on re-grant; `usedAt` is
      // intentionally left alone so re-granting a burned grant doesn't
      // unburn it (the admin should delete + recreate to reset).
      update: {},
      select: {
        id: true,
        userId: true,
        paradoxId: true,
        grantedByAdminId: true,
        createdAt: true,
        usedAt: true,
      },
    });

    res.status(201).json({
      grant: {
        ...grant,
        user: { id: user.id, username: user.username },
        paradox: {
          id: paradox.id,
          title: paradox.title,
          airDate: ymd(paradox.airDate!),
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/late-vow-grants
 * List active (unused) grants. Used + expired grants are hidden so the
 * panel stays readable; they can be surfaced on a "history" view later.
 */
adminRouter.get("/late-vow-grants", async (_req, res, next) => {
  try {
    const grants = await prisma.lateVowGrant.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        usedAt: true,
        user: { select: { id: true, username: true } },
        paradox: { select: { id: true, title: true, airDate: true } },
        grantedByAdmin: { select: { id: true, username: true } },
      },
    });
    res.json({
      grants: grants.map((g) => ({
        id: g.id,
        createdAt: g.createdAt,
        usedAt: g.usedAt,
        user: g.user,
        paradox: {
          id: g.paradox.id,
          title: g.paradox.title,
          airDate: g.paradox.airDate ? ymd(g.paradox.airDate) : null,
        },
        grantedBy: g.grantedByAdmin,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/late-vow-grants/:id
 * Revoke a grant. Hard delete — if the grant was already used, deleting
 * it doesn't undo the vote; it just removes the record from the active
 * list.
 */
adminRouter.delete("/late-vow-grants/:id", async (req, res, next) => {
  try {
    const id = req.params.id!;
    const existing = await prisma.lateVowGrant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "Grant not found", "not_found");
    await prisma.lateVowGrant.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Global Late-Vow Grants — opens the vow window to every user on one paradox.
// ──────────────────────────────────────────────────────────────────────────

const globalLateVowGrantSchema = z.object({
  paradoxDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/admin/global-late-vow-grants?paradoxDate=YYYY-MM-DD
 * Returns the active grant for the given paradox (or the most recent one)
 * so the panel can render a live ACTIVE/INACTIVE status. When `paradoxDate`
 * is omitted, defaults to the server's today.
 */
adminRouter.get("/global-late-vow-grants", async (req, res, next) => {
  try {
    const paradoxDate =
      typeof req.query.paradoxDate === "string"
        ? req.query.paradoxDate
        : resolvePhase().today;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paradoxDate)) {
      throw new HttpError(400, "Invalid paradoxDate", "bad_request");
    }
    const airDate = parseYmd(paradoxDate);
    const paradox = await prisma.paradox.findUnique({
      where: { airDate },
      select: { id: true, title: true, airDate: true },
    });
    if (!paradox) {
      res.json({
        paradoxDate,
        paradox: null,
        active: null,
      });
      return;
    }
    const active = await prisma.globalLateVowGrant.findFirst({
      where: { paradoxId: paradox.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        revokedAt: true,
        isActive: true,
        grantedByAdmin: { select: { id: true, username: true } },
      },
    });
    res.json({
      paradoxDate,
      paradox: {
        id: paradox.id,
        title: paradox.title,
        airDate: paradox.airDate ? ymd(paradox.airDate) : null,
      },
      active: active
        ? {
            id: active.id,
            createdAt: active.createdAt,
            revokedAt: active.revokedAt,
            isActive: active.isActive,
            grantedBy: active.grantedByAdmin,
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/admin/global-late-vow-grants
 * Create a global grant for the given paradox date. Idempotent at the
 * "currently active" level — if one is already active we return it
 * instead of inserting a duplicate. If none is active, a new row is
 * minted (preserving prior grant/revoke history).
 */
adminRouter.post("/global-late-vow-grants", async (req, res, next) => {
  try {
    const actingAdminId = (req as AuthedRequest).userId;
    const { paradoxDate } = globalLateVowGrantSchema.parse(req.body);
    const airDate = parseYmd(paradoxDate);
    const paradox = await prisma.paradox.findUnique({
      where: { airDate },
      select: { id: true, title: true, airDate: true },
    });
    if (!paradox) {
      throw new HttpError(
        404,
        `No paradox scheduled for ${paradoxDate}.`,
        "paradox_not_found",
      );
    }
    const existing = await prisma.globalLateVowGrant.findFirst({
      where: { paradoxId: paradox.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, revokedAt: true, isActive: true },
    });
    const grant =
      existing ??
      (await prisma.globalLateVowGrant.create({
        data: {
          paradoxId: paradox.id,
          grantedByAdminId: actingAdminId,
        },
        select: { id: true, createdAt: true, revokedAt: true, isActive: true },
      }));
    res.status(existing ? 200 : 201).json({
      grant: {
        ...grant,
        paradox: {
          id: paradox.id,
          title: paradox.title,
          airDate: paradox.airDate ? ymd(paradox.airDate) : null,
        },
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/global-late-vow-grants/:id
 * Revoke a global grant — flip `isActive` off and stamp `revokedAt`.
 * Soft delete so the audit trail stays intact.
 */
adminRouter.delete("/global-late-vow-grants/:id", async (req, res, next) => {
  try {
    const id = req.params.id!;
    const existing = await prisma.globalLateVowGrant.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!existing) throw new HttpError(404, "Grant not found", "not_found");
    await prisma.globalLateVowGrant.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Duel reports — players flag their opponent from inside a duel. The
// transcript ships with the report so a moderator can judge in one view.
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/reports", async (req, res, next) => {
  try {
    const status = req.query.status === "resolved" ? "resolved" : "open";
    const reports = await prisma.duelReport.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        reason: true,
        note: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        reporter: { select: { id: true, username: true } },
        reported: { select: { id: true, username: true, civilityScore: true, isBanned: true, isBot: true } },
        duel: {
          select: {
            id: true,
            kind: true,
            startedAt: true,
            transcriptJson: true,
            paradox: { select: { title: true } },
          },
        },
      },
    });
    res.json({ reports });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/reports/:id/resolve", async (req, res, next) => {
  try {
    const id = req.params.id ?? "";
    const report = await prisma.duelReport.update({
      where: { id },
      data: { status: "resolved", resolvedAt: new Date() },
      select: { id: true, status: true, resolvedAt: true },
    });
    res.json({ report });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Open Books — fixed monthly running costs (AI spend and Stripe revenue/fees
// are recorded automatically).
// ──────────────────────────────────────────────────────────────────────────

const COST_CATEGORIES = ["hosting", "database", "email", "domain", "tools", "other"] as const;
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

adminRouter.get("/operating-costs", async (req, res, next) => {
  try {
    const month = monthSchema.parse(req.query.month);
    const costs = await prisma.operatingCost.findMany({ where: { month }, orderBy: { createdAt: "asc" } });
    res.json({ costs, categories: COST_CATEGORIES });
  } catch (e) {
    next(e);
  }
});

const costSchema = z.object({
  month: monthSchema,
  category: z.enum(COST_CATEGORIES),
  label: z.string().trim().min(1).max(80),
  amountCents: z.number().int().min(0).max(100_000_000),
});

adminRouter.post("/operating-costs", async (req, res, next) => {
  try {
    const data = costSchema.parse(req.body);
    const cost = await prisma.operatingCost.create({ data });
    res.status(201).json({ cost });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/operating-costs/:id", async (req, res, next) => {
  try {
    await prisma.operatingCost.delete({ where: { id: req.params.id ?? "" } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Copy last month's fixed costs into a new month (most bills repeat). */
adminRouter.post("/operating-costs/copy", async (req, res, next) => {
  try {
    const { from, to } = z.object({ from: monthSchema, to: monthSchema }).parse(req.body);
    const source = await prisma.operatingCost.findMany({ where: { month: from } });
    if (source.length === 0) throw new HttpError(404, `No costs recorded for ${from}`, "not_found");
    await prisma.operatingCost.createMany({
      data: source.map((c) => ({ month: to, category: c.category, label: c.label, amountCents: c.amountCents })),
    });
    res.json({ copied: source.length });
  } catch (e) {
    next(e);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Test clock — force the game phase for everyone (staging / dev only).
// ──────────────────────────────────────────────────────────────────────────

adminRouter.get("/clock", async (_req, res, next) => {
  try {
    await refreshClockOverride();
    res.json({
      available: env.ALLOW_CLOCK_OVERRIDE,
      override: runtimeClockOverride(),
      phase: resolvePhase(),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/clock", async (req, res, next) => {
  try {
    if (!env.ALLOW_CLOCK_OVERRIDE) {
      throw new HttpError(403, "The test clock is disabled on this server (ALLOW_CLOCK_OVERRIDE).", "clock_disabled");
    }
    const { phase } = z.object({ phase: z.enum([...CLOCK_PHASES, "off"]) }).parse(req.body);
    await setClockOverride(phase === "off" ? null : phase);
    res.json({ override: runtimeClockOverride(), phase: resolvePhase() });
  } catch (e) {
    next(e);
  }
});
