-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supporterCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "supporterPlan" TEXT,
ADD COLUMN     "supporterSince" TIMESTAMP(3),
ADD COLUMN     "supporterStatus" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "supporterStripeCustomerId" TEXT,
ADD COLUMN     "supporterStripeSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "AiUsageDaily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "role" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicros" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingCost" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatingCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "stripeChargeId" TEXT NOT NULL,
    "customerId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,
    "refundedCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "feeEstimated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageDaily_date_idx" ON "AiUsageDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageDaily_date_role_model_key" ON "AiUsageDaily"("date", "role", "model");

-- CreateIndex
CREATE INDEX "OperatingCost_month_idx" ON "OperatingCost"("month");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueEvent_stripeChargeId_key" ON "RevenueEvent"("stripeChargeId");

-- CreateIndex
CREATE INDEX "RevenueEvent_occurredAt_idx" ON "RevenueEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "RevenueEvent_customerId_idx" ON "RevenueEvent"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_supporterStripeSubscriptionId_key" ON "User"("supporterStripeSubscriptionId");

