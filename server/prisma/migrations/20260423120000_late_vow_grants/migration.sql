-- CreateTable
CREATE TABLE "LateVowGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "grantedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "LateVowGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LateVowGrant_userId_paradoxId_key" ON "LateVowGrant"("userId", "paradoxId");

-- CreateIndex
CREATE INDEX "LateVowGrant_paradoxId_idx" ON "LateVowGrant"("paradoxId");

-- CreateIndex
CREATE INDEX "LateVowGrant_grantedByAdminId_idx" ON "LateVowGrant"("grantedByAdminId");

-- AddForeignKey
ALTER TABLE "LateVowGrant" ADD CONSTRAINT "LateVowGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateVowGrant" ADD CONSTRAINT "LateVowGrant_paradoxId_fkey" FOREIGN KEY ("paradoxId") REFERENCES "Paradox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateVowGrant" ADD CONSTRAINT "LateVowGrant_grantedByAdminId_fkey" FOREIGN KEY ("grantedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
