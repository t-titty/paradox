import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../db.js";
import { HttpError } from "../middleware/error.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { userHasCircleAccess } from "../lib/circleAccess.js";

export const circlesRouter = Router();

/* ---------- legacy apply form (kept for now, replaced by /pricing later) -- */

const applicationSchema = z.object({
  organization: z.string().min(2).max(120),
  kind: z.enum(["JUNIOR_HIGH", "HIGH_SCHOOL", "UNIVERSITY", "COMPANY"]),
  contactEmail: z.string().email(),
  note: z.string().max(1000).optional(),
});

circlesRouter.post("/apply", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const body = applicationSchema.parse(req.body);
    const row = await prisma.circleApplication.create({
      data: {
        organization: body.organization,
        kind: body.kind,
        contactEmail: body.contactEmail,
        note: body.note,
        submittedByUserId: userId,
      },
      select: { id: true, createdAt: true },
    });
    res.status(201).json({ application: row });
  } catch (e) {
    next(e);
  }
});

/* ---------- invite code generation ---------- */

// Crockford-style alphabet without 0/O and 1/I. 32 symbols × 8 chars gives
// 32^8 ≈ 1.1 trillion codes — collisions at our scale are vanishingly rare,
// but we still retry on unique-violation to be safe.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}

/* ---------- authorization helpers ---------- */

async function getMembership(userId: string, circleId: string) {
  return prisma.circleMembership.findUnique({
    where: { circleId_userId: { circleId, userId } },
    select: { role: true },
  });
}

async function requireCircleMember(userId: string, circleId: string) {
  const m = await getMembership(userId, circleId);
  if (!m) throw new HttpError(404, "Not found", "not_found");
  return m;
}

async function requireCircleManager(userId: string, circleId: string) {
  const m = await getMembership(userId, circleId);
  if (!m || (m.role !== "OWNER" && m.role !== "ADMIN")) {
    throw new HttpError(404, "Not found", "not_found");
  }
  return m;
}

/* ---------- schemas ---------- */

const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["JUNIOR_HIGH", "HIGH_SCHOOL", "UNIVERSITY", "CORPORATE"]),
});

const createGameSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional(),
  paradoxPackage: z
    .enum(["STANDARD", "JUNIOR_HIGH", "HIGH_SCHOOL", "UNIVERSITY", "CORPORATE"])
    .default("STANDARD"),
  dropHour: z.number().int().min(0).max(23).optional(),
  vowEndHour: z.number().int().min(0).max(23).optional(),
  sortEndHour: z.number().int().min(0).max(23).optional(),
  duelHour: z.number().int().min(0).max(23).optional(),
});

const updateGameSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  isActive: z.boolean().optional(),
});

const createInviteSchema = z.object({
  maxUses: z.number().int().min(1).max(10_000).optional(),
  // Client sends an ISO string; we parse to Date.
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

/* ---------- circles ---------- */

/**
 * POST /api/circles
 * Create a circle. The creator becomes the OWNER (membership row). Free
 * circles start in "trial" subscription status until the Stripe pass lands.
 */
circlesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;

    // Paywall: block creation unless the user is admin-granted or has an
    // active paid subscription. Admins can still toggle the grant per-user
    // from the admin panel for beta/testing.
    const allowed = await userHasCircleAccess(userId);
    if (!allowed) {
      throw new HttpError(
        403,
        "A paid plan or admin grant is required to create a Circle.",
        "circle_access_required",
      );
    }

    const body = createCircleSchema.parse(req.body);

    const circle = await prisma.circle.create({
      data: {
        name: body.name,
        type: body.type,
        ownerId: userId,
        memberships: {
          create: { userId, role: "OWNER" },
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });
    res.status(201).json({ circle });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/circles/mine
 * All circles the current user is a member of (own + joined). Includes role
 * and a thin game summary so the dashboard can render without a second call.
 */
circlesRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const memberships = await prisma.circleMembership.findMany({
      where: { userId },
      orderBy: { joinedAt: "desc" },
      select: {
        role: true,
        joinedAt: true,
        circle: {
          select: {
            id: true,
            name: true,
            type: true,
            subscriptionStatus: true,
            createdAt: true,
            _count: { select: { memberships: true, games: true } },
          },
        },
      },
    });
    res.json({
      circles: memberships.map((m) => ({
        ...m.circle,
        role: m.role,
        joinedAt: m.joinedAt,
        memberCount: m.circle._count.memberships,
        gameCount: m.circle._count.games,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/circles/:id
 * Detail view. Any member can see basic info + game list. Managers see
 * pending invite codes too.
 */
circlesRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const circleId = req.params.id!;
    const m = await requireCircleMember(userId, circleId);
    const isManager = m.role === "OWNER" || m.role === "ADMIN";

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      select: {
        id: true,
        name: true,
        type: true,
        subscriptionStatus: true,
        createdAt: true,
        ownerId: true,
        games: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            paradoxPackage: true,
            dropHour: true,
            vowEndHour: true,
            sortEndHour: true,
            duelHour: true,
            isActive: true,
            createdAt: true,
            inviteCodes: isManager
              ? {
                  orderBy: { createdAt: "desc" },
                  select: {
                    id: true,
                    code: true,
                    uses: true,
                    maxUses: true,
                    expiresAt: true,
                    createdAt: true,
                  },
                }
              : false,
            _count: { select: { inviteCodes: true } },
          },
        },
        _count: { select: { memberships: true } },
      },
    });
    if (!circle) throw new HttpError(404, "Not found", "not_found");

    res.json({
      circle,
      viewer: { role: m.role, isManager },
    });
  } catch (e) {
    next(e);
  }
});

/* ---------- games ---------- */

circlesRouter.post("/:id/games", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const circleId = req.params.id!;
    await requireCircleManager(userId, circleId);

    const body = createGameSchema.parse(req.body);
    const game = await prisma.circleGame.create({
      data: {
        circleId,
        name: body.name,
        description: body.description,
        paradoxPackage: body.paradoxPackage,
        ...(body.dropHour !== undefined ? { dropHour: body.dropHour } : {}),
        ...(body.vowEndHour !== undefined ? { vowEndHour: body.vowEndHour } : {}),
        ...(body.sortEndHour !== undefined ? { sortEndHour: body.sortEndHour } : {}),
        ...(body.duelHour !== undefined ? { duelHour: body.duelHour } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        paradoxPackage: true,
        dropHour: true,
        vowEndHour: true,
        sortEndHour: true,
        duelHour: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(201).json({ game });
  } catch (e) {
    next(e);
  }
});

circlesRouter.patch("/:id/games/:gameId", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const circleId = req.params.id!;
    const gameId = req.params.gameId!;
    await requireCircleManager(userId, circleId);

    const body = updateGameSchema.parse(req.body);
    // Guard against editing a game from a different circle.
    const existing = await prisma.circleGame.findFirst({
      where: { id: gameId, circleId },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "Not found", "not_found");

    const game = await prisma.circleGame.update({
      where: { id: gameId },
      data: body,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
    });
    res.json({ game });
  } catch (e) {
    next(e);
  }
});

/* ---------- invites ---------- */

circlesRouter.post(
  "/:id/games/:gameId/invites",
  requireAuth,
  async (req, res, next) => {
    try {
      const { userId } = req as AuthedRequest;
      const circleId = req.params.id!;
      const gameId = req.params.gameId!;
      await requireCircleManager(userId, circleId);

      const body = createInviteSchema.parse(req.body);
      const game = await prisma.circleGame.findFirst({
        where: { id: gameId, circleId },
        select: { id: true },
      });
      if (!game) throw new HttpError(404, "Not found", "not_found");

      // Retry on the astronomically-unlikely event of a code collision.
      let lastErr: unknown;
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateInviteCode();
        try {
          const invite = await prisma.circleInviteCode.create({
            data: {
              circleGameId: gameId,
              code,
              maxUses: body.maxUses,
              expiresAt: body.expiresAt,
              createdById: userId,
            },
            select: {
              id: true,
              code: true,
              maxUses: true,
              expiresAt: true,
              uses: true,
              createdAt: true,
            },
          });
          return res.status(201).json({ invite });
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr ?? new HttpError(500, "Could not generate invite code", "server_error");
    } catch (e) {
      next(e);
    }
  },
);

/**
 * GET /api/circles/invites/:code
 * Public-ish preview of an invite code so the /join/:code page can show the
 * user what they're about to join before they confirm. Authed so we can tell
 * them whether they'd be joining fresh or are already a member.
 */
circlesRouter.get("/invites/:code", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const code = req.params.code!.toUpperCase();
    const invite = await prisma.circleInviteCode.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        uses: true,
        maxUses: true,
        expiresAt: true,
        circleGame: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            circle: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });
    if (!invite) throw new HttpError(404, "Invite not found", "invite_not_found");

    const expired = invite.expiresAt ? invite.expiresAt <= new Date() : false;
    const exhausted =
      invite.maxUses !== null && invite.maxUses !== undefined && invite.uses >= invite.maxUses;
    const gamePaused = !invite.circleGame.isActive;

    const existing = await prisma.circleMembership.findUnique({
      where: {
        circleId_userId: { circleId: invite.circleGame.circle.id, userId },
      },
      select: { role: true },
    });

    res.json({
      invite: {
        code: invite.code,
        game: {
          id: invite.circleGame.id,
          name: invite.circleGame.name,
          description: invite.circleGame.description,
        },
        circle: invite.circleGame.circle,
        expiresAt: invite.expiresAt,
        usesRemaining:
          invite.maxUses !== null && invite.maxUses !== undefined
            ? invite.maxUses - invite.uses
            : null,
      },
      status: {
        expired,
        exhausted,
        gamePaused,
        alreadyMember: Boolean(existing),
        canJoin: !expired && !exhausted && !gamePaused,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/circles/invites/:code/join
 * Consume the invite: increment uses, create a membership on the parent
 * circle. Idempotent if the user is already a member — we just return the
 * existing membership without bumping `uses`.
 */
circlesRouter.post("/invites/:code/join", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const code = req.params.code!.toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      const invite = await tx.circleInviteCode.findUnique({
        where: { code },
        select: {
          id: true,
          uses: true,
          maxUses: true,
          expiresAt: true,
          circleGame: {
            select: {
              id: true,
              isActive: true,
              circleId: true,
              circle: { select: { id: true, name: true, type: true } },
            },
          },
        },
      });
      if (!invite) throw new HttpError(404, "Invite not found", "invite_not_found");
      if (invite.expiresAt && invite.expiresAt <= new Date()) {
        throw new HttpError(410, "Invite expired", "invite_expired");
      }
      if (
        invite.maxUses !== null &&
        invite.maxUses !== undefined &&
        invite.uses >= invite.maxUses
      ) {
        throw new HttpError(410, "Invite fully used", "invite_exhausted");
      }
      if (!invite.circleGame.isActive) {
        throw new HttpError(409, "Game is paused", "game_paused");
      }

      const circleId = invite.circleGame.circleId;
      const existing = await tx.circleMembership.findUnique({
        where: { circleId_userId: { circleId, userId } },
      });
      if (existing) {
        return { circle: invite.circleGame.circle, alreadyMember: true };
      }

      await tx.circleMembership.create({
        data: { circleId, userId, role: "MEMBER" },
      });
      await tx.circleInviteCode.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      });
      return { circle: invite.circleGame.circle, alreadyMember: false };
    });

    res.status(result.alreadyMember ? 200 : 201).json(result);
  } catch (e) {
    next(e);
  }
});

/* ---------- members ---------- */

circlesRouter.get("/:id/members", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req as AuthedRequest;
    const circleId = req.params.id!;
    await requireCircleMember(userId, circleId);

    const members = await prisma.circleMembership.findMany({
      where: { circleId },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            wisdomPoints: true,
            civilityScore: true,
          },
        },
      },
    });
    res.json({ members });
  } catch (e) {
    next(e);
  }
});

circlesRouter.delete("/:id/members/:userId", requireAuth, async (req, res, next) => {
  try {
    const { userId: actingUserId } = req as AuthedRequest;
    const circleId = req.params.id!;
    const targetUserId = req.params.userId!;
    await requireCircleManager(actingUserId, circleId);

    // Owners cannot be removed — their membership is tied to the Circle's
    // ownerId column and would require an ownership transfer first.
    const target = await prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId: targetUserId } },
      select: { role: true },
    });
    if (!target) throw new HttpError(404, "Member not found", "not_found");
    if (target.role === "OWNER") {
      throw new HttpError(400, "Cannot remove the owner", "cannot_remove_owner");
    }

    await prisma.circleMembership.delete({
      where: { circleId_userId: { circleId, userId: targetUserId } },
    });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
