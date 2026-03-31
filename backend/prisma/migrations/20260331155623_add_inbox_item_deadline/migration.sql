-- AlterTable
ALTER TABLE "InboxItem" ADD COLUMN     "deadline" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "InboxItem_deadline_idx" ON "InboxItem"("deadline");
