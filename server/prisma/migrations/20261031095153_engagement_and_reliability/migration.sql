-- AlterTable
ALTER TABLE "Duel" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'pvp',
ADD COLUMN     "stateJson" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageAttestedAt" TIMESTAMP(3),
ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "streakFreezes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OracleMark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fallacyType" TEXT,
    "tribe" "Tribe" NOT NULL,
    "messageText" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakFreezeUse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreakFreezeUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuelReport" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DuelReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OracleMark_userId_kind_idx" ON "OracleMark"("userId", "kind");

-- CreateIndex
CREATE INDEX "OracleMark_createdAt_kind_idx" ON "OracleMark"("createdAt", "kind");

-- CreateIndex
CREATE INDEX "OracleMark_paradoxId_kind_idx" ON "OracleMark"("paradoxId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "StreakFreezeUse_userId_date_key" ON "StreakFreezeUse"("userId", "date");

-- CreateIndex
CREATE INDEX "DuelReport_status_createdAt_idx" ON "DuelReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DuelReport_reportedId_idx" ON "DuelReport"("reportedId");

-- AddForeignKey
ALTER TABLE "OracleMark" ADD CONSTRAINT "OracleMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleMark" ADD CONSTRAINT "OracleMark_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakFreezeUse" ADD CONSTRAINT "StreakFreezeUse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelReport" ADD CONSTRAINT "DuelReport_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelReport" ADD CONSTRAINT "DuelReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelReport" ADD CONSTRAINT "DuelReport_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing players skip the first-run practice round; only new sign-ups see it.
UPDATE "User" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;
