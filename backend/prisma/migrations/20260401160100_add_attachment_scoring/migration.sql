-- AlterTable
ALTER TABLE "OpportunityAttachment" ADD COLUMN     "scoreResult" JSONB,
ADD COLUMN     "scoredAt" TIMESTAMP(3);
