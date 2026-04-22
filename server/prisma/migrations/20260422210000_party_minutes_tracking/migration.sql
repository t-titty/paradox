-- AlterTable
ALTER TABLE "User"
    DROP COLUMN "freePartySessions",
    ADD COLUMN "freePartyMinutesUsed" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "partyProTrialMinutesUsed" INTEGER NOT NULL DEFAULT 0;
