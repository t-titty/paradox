-- CreateEnum
CREATE TYPE "Tribe" AS ENUM ('Utilitarian', 'Deontologist', 'VirtueEthicist', 'Nihilist', 'Stoic', 'Existentialist', 'Hedonist');

-- CreateEnum
CREATE TYPE "Choice" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "wisdomPoints" INTEGER NOT NULL DEFAULT 0,
    "civilityScore" INTEGER NOT NULL DEFAULT 100,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paradox" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "airDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paradox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "choice" "Choice" NOT NULL,
    "justification" TEXT NOT NULL,
    "tribeAssigned" "Tribe",
    "tribeConfidence" DOUBLE PRECISION,
    "tribeReasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortedAt" TIMESTAMP(3),

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TribeHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "tribe" "Tribe" NOT NULL,
    "airDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TribeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "transcriptJson" JSONB NOT NULL DEFAULT '[]',
    "synthesisText" TEXT,
    "synthesisGeneratedAt" TIMESTAMP(3),
    "signedByAAt" TIMESTAMP(3),
    "signedByBAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "bothSigned" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Duel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleApplication" (
    "id" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "note" TEXT,
    "submittedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SynthesisArchive" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "paradoxTitle" TEXT NOT NULL,
    "tribeA" "Tribe" NOT NULL,
    "tribeB" "Tribe" NOT NULL,
    "synthesisText" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SynthesisArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Paradox_airDate_key" ON "Paradox"("airDate");

-- CreateIndex
CREATE INDEX "Vote_paradoxId_choice_idx" ON "Vote"("paradoxId", "choice");

-- CreateIndex
CREATE INDEX "Vote_paradoxId_tribeAssigned_idx" ON "Vote"("paradoxId", "tribeAssigned");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_paradoxId_key" ON "Vote"("userId", "paradoxId");

-- CreateIndex
CREATE INDEX "TribeHistory_userId_airDate_idx" ON "TribeHistory"("userId", "airDate");

-- CreateIndex
CREATE UNIQUE INDEX "TribeHistory_userId_paradoxId_key" ON "TribeHistory"("userId", "paradoxId");

-- CreateIndex
CREATE INDEX "Duel_paradoxId_idx" ON "Duel"("paradoxId");

-- CreateIndex
CREATE INDEX "Duel_bothSigned_idx" ON "Duel"("bothSigned");

-- CreateIndex
CREATE INDEX "CircleApplication_createdAt_idx" ON "CircleApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SynthesisArchive_duelId_key" ON "SynthesisArchive"("duelId");

-- CreateIndex
CREATE INDEX "SynthesisArchive_signedAt_idx" ON "SynthesisArchive"("signedAt");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_paradoxId_fkey" FOREIGN KEY ("paradoxId") REFERENCES "Paradox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeHistory" ADD CONSTRAINT "TribeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TribeHistory" ADD CONSTRAINT "TribeHistory_paradoxId_fkey" FOREIGN KEY ("paradoxId") REFERENCES "Paradox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_paradoxId_fkey" FOREIGN KEY ("paradoxId") REFERENCES "Paradox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynthesisArchive" ADD CONSTRAINT "SynthesisArchive_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
