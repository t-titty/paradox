-- CreateTable
CREATE TABLE "ThrowbackRevote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalVoteId" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "newChoice" "Choice" NOT NULL,
    "newJustification" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThrowbackRevote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThrowbackRevote_originalVoteId_key" ON "ThrowbackRevote"("originalVoteId");

-- CreateIndex
CREATE INDEX "ThrowbackRevote_userId_createdAt_idx" ON "ThrowbackRevote"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ThrowbackRevote" ADD CONSTRAINT "ThrowbackRevote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThrowbackRevote" ADD CONSTRAINT "ThrowbackRevote_originalVoteId_fkey" FOREIGN KEY ("originalVoteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThrowbackRevote" ADD CONSTRAINT "ThrowbackRevote_paradoxId_fkey" FOREIGN KEY ("paradoxId") REFERENCES "Paradox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
