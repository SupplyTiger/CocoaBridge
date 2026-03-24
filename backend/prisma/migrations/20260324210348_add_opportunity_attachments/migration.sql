-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "resourceLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "OpportunityAttachment" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "postedDate" TIMESTAMP(3),
    "attachmentOrder" INTEGER,
    "downloadUrl" TEXT NOT NULL,
    "parsedText" TEXT,
    "parsedAt" TIMESTAMP(3),
    "opportunityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityAttachment_resourceId_key" ON "OpportunityAttachment"("resourceId");

-- CreateIndex
CREATE INDEX "OpportunityAttachment_opportunityId_idx" ON "OpportunityAttachment"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityAttachment_name_idx" ON "OpportunityAttachment"("name");

-- AddForeignKey
ALTER TABLE "OpportunityAttachment" ADD CONSTRAINT "OpportunityAttachment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
