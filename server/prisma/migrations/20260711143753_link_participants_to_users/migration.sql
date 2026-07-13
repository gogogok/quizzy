-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
