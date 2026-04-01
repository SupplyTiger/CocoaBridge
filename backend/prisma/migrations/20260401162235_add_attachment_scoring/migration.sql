-- CreateEnum
CREATE TYPE "ScoringQueueStatus" AS ENUM ('PENDING', 'APPROVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "InboxItem" ADD COLUMN     "attachmentScore" INTEGER,
ADD COLUMN     "matchedSignals" JSONB;

-- CreateTable
CREATE TABLE "ScoringQueue" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "matchedSignals" JSONB NOT NULL,
    "status" "ScoringQueueStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoringQueue_opportunityId_key" ON "ScoringQueue"("opportunityId");

-- CreateIndex
CREATE INDEX "ScoringQueue_status_idx" ON "ScoringQueue"("status");

-- CreateIndex
CREATE INDEX "ScoringQueue_expiresAt_idx" ON "ScoringQueue"("expiresAt");

-- AddForeignKey
ALTER TABLE "ScoringQueue" ADD CONSTRAINT "ScoringQueue_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
