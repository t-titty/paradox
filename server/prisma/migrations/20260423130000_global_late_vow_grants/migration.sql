-- CreateTable
CREATE TABLE "GlobalLateVowGrant" (
    "id" TEXT NOT NULL,
    "paradoxId" TEXT NOT NULL,
    "grantedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GlobalLateVowGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GlobalLateVowGrant_paradoxId_isActive_idx" ON "GlobalLateVowGrant"("paradoxId", "isActive");

-- CreateIndex
CREATE INDEX "GlobalLateVowGrant_grantedByAdminId_idx" ON "GlobalLateVowGrant"("grantedByAdminId");

-- AddForeignKey
ALTER TABLE "GlobalLateVowGrant" ADD CONSTRAINT "GlobalLateVowGrant_paradoxId_fkey" FOREIGN KEY ("paradoxId") REFERENCES "Paradox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalLateVowGrant" ADD CONSTRAINT "GlobalLateVowGrant_grantedByAdminId_fkey" FOREIGN KEY ("grantedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
