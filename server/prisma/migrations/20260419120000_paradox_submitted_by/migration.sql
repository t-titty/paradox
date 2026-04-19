-- AlterTable
ALTER TABLE "Paradox" ADD COLUMN "submittedById" TEXT;

-- CreateIndex
CREATE INDEX "Paradox_submittedById_idx" ON "Paradox"("submittedById");

-- AddForeignKey
ALTER TABLE "Paradox" ADD CONSTRAINT "Paradox_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
