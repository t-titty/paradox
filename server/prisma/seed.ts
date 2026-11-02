import { PrismaClient } from "@prisma/client";
import { PARADOXES } from "./paradoxes.js";
import { ALL_PACKS } from "./paradox-packs.js";
import { addDaysYmd, zonedYmd } from "../src/lib/time.js";

function utcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

const prisma = new PrismaClient();

async function main() {
  // Add any paradoxes that aren't in the database yet (matched by title),
  // scheduling them one per day on the next free dates. Existing rows are
  // NEVER rescheduled or rewritten: this script runs on every production
  // boot, and an earlier version re-dated the whole calendar from "today"
  // each time — which swapped today's paradox out from under live votes.
  const tz = process.env.PHASE_TIMEZONE || "America/New_York";
  const today = zonedYmd(new Date(), tz);

  const existingTitles = new Set(
    (await prisma.paradox.findMany({ select: { title: true } })).map((p) => p.title),
  );
  const latest = await prisma.paradox.findFirst({
    where: { airDate: { not: null } },
    orderBy: { airDate: "desc" },
    select: { airDate: true },
  });
  let nextDate = today;
  if (latest?.airDate) {
    const latestYmd = latest.airDate.toISOString().slice(0, 10);
    if (latestYmd >= today) nextDate = addDaysYmd(latestYmd, 1);
  }

  let added = 0;
  for (const p of PARADOXES) {
    if (existingTitles.has(p.title)) continue;
    // Skip over any date that is already taken (e.g. an approved submission).
    while (await prisma.paradox.findUnique({ where: { airDate: utcDate(nextDate) }, select: { id: true } })) {
      nextDate = addDaysYmd(nextDate, 1);
    }
    await prisma.paradox.create({ data: { ...p, airDate: utcDate(nextDate) } });
    existingTitles.add(p.title);
    nextDate = addDaysYmd(nextDate, 1);
    added++;
  }

  console.log(`[seed] ${added} new paradoxes scheduled (${PARADOXES.length - added} already present)`);

  // Private Circles paradox packs — JR_HIGH / HIGH_SCHOOL / UNIVERSITY /
  // CORPORATE. STANDARD is intentionally not seeded here (circles on STANDARD
  // draw from the same global Paradox pool above).
  for (const { pkg, data } of ALL_PACKS) {
    await prisma.circleParadoxPack.upsert({
      where: { package: pkg },
      update: { paradoxes: data },
      create: { package: pkg, paradoxes: data },
    });
  }
  console.log(`[seed] ${ALL_PACKS.length} circle paradox packs upserted`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
