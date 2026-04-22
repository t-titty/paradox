-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "freePartySessions" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "partyProStatus" TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN "partyProStripeCustomerId" TEXT,
    ADD COLUMN "partyProStripeSubscriptionId" TEXT,
    ADD COLUMN "partyProCurrentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_partyProStripeSubscriptionId_key" ON "User"("partyProStripeSubscriptionId");
