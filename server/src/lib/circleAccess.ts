import { prisma } from "../db.js";

/**
 * A user has circle-creation access if either:
 *   - an admin has granted them (isGrantedCircleAccess), or
 *   - they already own a Circle with an active paid subscription.
 *
 * Stripe isn't wired yet, so the second branch effectively never fires; it's
 * in place now so this single helper stays authoritative once subscriptions
 * start flipping to "active".
 */
export async function userHasCircleAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isGrantedCircleAccess: true },
  });
  if (!user) return false;
  if (user.isGrantedCircleAccess) return true;

  const paidCircle = await prisma.circle.findFirst({
    where: { ownerId: userId, subscriptionStatus: "active" },
    select: { id: true },
  });
  return Boolean(paidCircle);
}
