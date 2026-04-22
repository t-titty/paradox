-- AlterTable
ALTER TABLE "Circle" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Circle" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Circle" ADD COLUMN "stripePriceLookupKey" TEXT;
ALTER TABLE "Circle" ADD COLUMN "billingPeriod" TEXT;
ALTER TABLE "Circle" ADD COLUMN "seatLimit" INTEGER;
ALTER TABLE "Circle" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Circle_stripeSubscriptionId_key" ON "Circle"("stripeSubscriptionId");
CREATE INDEX "Circle_stripeCustomerId_idx" ON "Circle"("stripeCustomerId");
