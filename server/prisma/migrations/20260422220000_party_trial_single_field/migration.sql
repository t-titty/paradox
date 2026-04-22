-- AlterTable
ALTER TABLE "User"
    DROP COLUMN "freePartyMinutesUsed",
    DROP COLUMN "partyProTrialMinutesUsed",
    ADD COLUMN "partyTrialMinutesUsed" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "partyProStripePriceLookupKey" TEXT;
