import { prisma } from "../db.js";

/**
 * Safety rules for school circles (Junior High and High School), whose
 * members are minors.
 *
 *  - A member of a school circle is only ever matched with someone who
 *    shares one of their school circles (or with the AI sparring partner).
 *    Adults outside the school can never be paired with them.
 *  - Their duel messages go through the profanity filter and are never
 *    shown in public highlights.
 */

const SCHOOL_TYPES = ["JUNIOR_HIGH", "HIGH_SCHOOL"] as const;

export async function schoolCircleIds(userId: string): Promise<string[]> {
  const rows = await prisma.circleMembership.findMany({
    where: { userId, circle: { type: { in: [...SCHOOL_TYPES] } } },
    select: { circleId: true },
  });
  return rows.map((r) => r.circleId);
}

/**
 * Pure matching rule: two players may duel when neither is in a school
 * circle, or when they share at least one school circle.
 */
export function canPair(aSchoolCircles: string[], bSchoolCircles: string[]): boolean {
  if (aSchoolCircles.length === 0 && bSchoolCircles.length === 0) return true;
  const set = new Set(aSchoolCircles);
  return bSchoolCircles.some((id) => set.has(id));
}
