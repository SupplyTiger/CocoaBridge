/*
  Warnings:

  - You are about to drop the column `agencyName` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `officeName` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `subAgencyName` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "agencyName",
DROP COLUMN "officeName",
DROP COLUMN "subAgencyName";
