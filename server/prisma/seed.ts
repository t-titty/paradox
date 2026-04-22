import { PrismaClient } from "@prisma/client";
import { PARADOXES } from "./paradoxes.js";
import { ALL_PACKS } from "./paradox-packs.js";

const prisma = new PrismaClient();

async function main() {
  // Schedule all 365 paradoxes starting from today, one per day. Re-running
  // is idempotent on airDate (upsert). If you re-seed mid-year the sequence
  // restarts from that day — that's fine for demos; prod would want a
  // calendar-day-of-year mapping instead.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < PARADOXES.length; i++) {
    const p = PARADOXES[i]!;
    const airDate = new Date(today);
    airDate.setDate(airDate.getDate() + i);

    await prisma.paradox.upsert({
      where: { airDate },
      update: {
        title: p.title,
        description: p.description,
        optionA: p.optionA,
        optionB: p.optionB,
        category: p.category,
      },
      create: { ...p, airDate },
    });
  }

  console.log(`[seed] ${PARADOXES.length} paradoxes scheduled starting ${today.toDateString()}`);

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
