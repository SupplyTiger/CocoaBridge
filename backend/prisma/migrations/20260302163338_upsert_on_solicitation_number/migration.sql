/*
  Warnings:

  - A unique constraint covering the columns `[solicitationNumber]` on the table `Opportunity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Opportunity_solicitationNumber_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_solicitationNumber_key" ON "Opportunity"("solicitationNumber");
