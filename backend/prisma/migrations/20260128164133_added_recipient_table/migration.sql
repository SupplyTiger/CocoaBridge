/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Award` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `ContactLink` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `InboxItem` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `IndustryDay` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[buyingOrganizationId,externalId]` on the table `ContactLink` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('AGENCY', 'SUBAGENCY', 'OFFICE', 'OTHER');

-- DropForeignKey
ALTER TABLE "Award" DROP CONSTRAINT "Award_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ContactLink" DROP CONSTRAINT "ContactLink_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "IndustryDay" DROP CONSTRAINT "IndustryDay_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Opportunity" DROP CONSTRAINT "Opportunity_organizationId_fkey";

-- DropIndex
DROP INDEX "ContactLink_organizationId_externalId_key";

-- DropIndex
DROP INDEX "ContactLink_organizationId_idx";

-- DropIndex
DROP INDEX "InboxItem_organizationId_idx";

-- AlterTable
ALTER TABLE "Award" DROP COLUMN "organizationId",
ADD COLUMN     "buyingOrganizationId" TEXT,
ADD COLUMN     "recipientId" TEXT;

-- AlterTable
ALTER TABLE "ContactLink" DROP COLUMN "organizationId",
ADD COLUMN     "buyingOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "InboxItem" DROP COLUMN "organizationId",
ADD COLUMN     "buyingOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "IndustryDay" DROP COLUMN "organizationId",
ADD COLUMN     "buyingOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "organizationId",
ADD COLUMN     "agencyName" TEXT,
ADD COLUMN     "buyingOrganizationId" TEXT,
ADD COLUMN     "officeName" TEXT,
ADD COLUMN     "subAgencyName" TEXT;

-- DropTable
DROP TABLE "Organization";

-- CreateTable
CREATE TABLE "BuyingOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "level" "OrgLevel" NOT NULL DEFAULT 'OTHER',
    "parentId" TEXT,
    "externalId" TEXT,
    "pathName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyingOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "uei" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuyingOrganization_name_idx" ON "BuyingOrganization"("name");

-- CreateIndex
CREATE INDEX "BuyingOrganization_parentId_idx" ON "BuyingOrganization"("parentId");

-- CreateIndex
CREATE INDEX "BuyingOrganization_level_idx" ON "BuyingOrganization"("level");

-- CreateIndex
CREATE INDEX "BuyingOrganization_name_externalId_idx" ON "BuyingOrganization"("name", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_uei_key" ON "Recipient"("uei");

-- CreateIndex
CREATE INDEX "Recipient_name_idx" ON "Recipient"("name");

-- CreateIndex
CREATE INDEX "Recipient_uei_idx" ON "Recipient"("uei");

-- CreateIndex
CREATE INDEX "Award_buyingOrganizationId_idx" ON "Award"("buyingOrganizationId");

-- CreateIndex
CREATE INDEX "Award_recipientId_idx" ON "Award"("recipientId");

-- CreateIndex
CREATE INDEX "ContactLink_buyingOrganizationId_idx" ON "ContactLink"("buyingOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactLink_buyingOrganizationId_externalId_key" ON "ContactLink"("buyingOrganizationId", "externalId");

-- CreateIndex
CREATE INDEX "InboxItem_buyingOrganizationId_idx" ON "InboxItem"("buyingOrganizationId");

-- AddForeignKey
ALTER TABLE "ContactLink" ADD CONSTRAINT "ContactLink_buyingOrganizationId_fkey" FOREIGN KEY ("buyingOrganizationId") REFERENCES "BuyingOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyingOrganization" ADD CONSTRAINT "BuyingOrganization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BuyingOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_buyingOrganizationId_fkey" FOREIGN KEY ("buyingOrganizationId") REFERENCES "BuyingOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_buyingOrganizationId_fkey" FOREIGN KEY ("buyingOrganizationId") REFERENCES "BuyingOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryDay" ADD CONSTRAINT "IndustryDay_buyingOrganizationId_fkey" FOREIGN KEY ("buyingOrganizationId") REFERENCES "BuyingOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_buyingOrganizationId_fkey" FOREIGN KEY ("buyingOrganizationId") REFERENCES "BuyingOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
