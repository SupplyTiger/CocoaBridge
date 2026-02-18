/*
  Warnings:

  - A unique constraint covering the columns `[source,opportunityId]` on the table `InboxItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[source,awardId]` on the table `InboxItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InboxItem_source_opportunityId_key" ON "InboxItem"("source", "opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "InboxItem_source_awardId_key" ON "InboxItem"("source", "awardId");
