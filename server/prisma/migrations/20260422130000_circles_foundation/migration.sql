-- CreateEnum
CREATE TYPE "CircleType" AS ENUM ('JUNIOR_HIGH', 'HIGH_SCHOOL', 'UNIVERSITY', 'CORPORATE');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "ParadoxPackage" AS ENUM ('STANDARD', 'JUNIOR_HIGH', 'HIGH_SCHOOL', 'UNIVERSITY', 'CORPORATE');

-- CreateTable
CREATE TABLE "Circle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CircleType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMembership" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleGame" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "paradoxPackage" "ParadoxPackage" NOT NULL DEFAULT 'STANDARD',
    "dropHour" INTEGER NOT NULL DEFAULT 8,
    "vowEndHour" INTEGER NOT NULL DEFAULT 12,
    "sortEndHour" INTEGER NOT NULL DEFAULT 20,
    "duelHour" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleInviteCode" (
    "id" TEXT NOT NULL,
    "circleGameId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "CircleInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleParadoxPack" (
    "id" TEXT NOT NULL,
    "package" "ParadoxPackage" NOT NULL,
    "paradoxes" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleParadoxPack_pkey" PRIMARY KEY ("id")
);

-- AlterTable: scope votes + duels to a circle game (nullable = global)
ALTER TABLE "Vote" ADD COLUMN "circleGameId" TEXT;
ALTER TABLE "Duel" ADD COLUMN "circleGameId" TEXT;

-- CreateIndex
CREATE INDEX "Circle_ownerId_idx" ON "Circle"("ownerId");
CREATE UNIQUE INDEX "CircleMembership_circleId_userId_key" ON "CircleMembership"("circleId", "userId");
CREATE INDEX "CircleMembership_userId_idx" ON "CircleMembership"("userId");
CREATE INDEX "CircleGame_circleId_idx" ON "CircleGame"("circleId");
CREATE UNIQUE INDEX "CircleInviteCode_code_key" ON "CircleInviteCode"("code");
CREATE INDEX "CircleInviteCode_circleGameId_idx" ON "CircleInviteCode"("circleGameId");
CREATE UNIQUE INDEX "CircleParadoxPack_package_key" ON "CircleParadoxPack"("package");
CREATE INDEX "Vote_circleGameId_idx" ON "Vote"("circleGameId");
CREATE INDEX "Duel_circleGameId_idx" ON "Duel"("circleGameId");

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CircleMembership" ADD CONSTRAINT "CircleMembership_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleMembership" ADD CONSTRAINT "CircleMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleGame" ADD CONSTRAINT "CircleGame_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleInviteCode" ADD CONSTRAINT "CircleInviteCode_circleGameId_fkey" FOREIGN KEY ("circleGameId") REFERENCES "CircleGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CircleInviteCode" ADD CONSTRAINT "CircleInviteCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_circleGameId_fkey" FOREIGN KEY ("circleGameId") REFERENCES "CircleGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Duel" ADD CONSTRAINT "Duel_circleGameId_fkey" FOREIGN KEY ("circleGameId") REFERENCES "CircleGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
