/*
  Warnings:

  - You are about to drop the `NationalStockNumber` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NationalStockNumber" DROP CONSTRAINT "NationalStockNumber_pscCode_fkey";

-- DropTable
DROP TABLE "NationalStockNumber";

-- CreateTable
CREATE TABLE "FederalLogisticsInformationSystem" (
    "id" TEXT NOT NULL,
    "nsn" TEXT NOT NULL,
    "niin" TEXT NOT NULL,
    "pscCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "characteristics" TEXT,
    "commonName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FederalLogisticsInformationSystem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FederalLogisticsInformationSystem_nsn_key" ON "FederalLogisticsInformationSystem"("nsn");

-- CreateIndex
CREATE INDEX "FederalLogisticsInformationSystem_pscCode_idx" ON "FederalLogisticsInformationSystem"("pscCode");

-- CreateIndex
CREATE INDEX "FederalLogisticsInformationSystem_itemName_idx" ON "FederalLogisticsInformationSystem"("itemName");

-- CreateIndex
CREATE INDEX "FederalLogisticsInformationSystem_commonName_idx" ON "FederalLogisticsInformationSystem"("commonName");

-- AddForeignKey
ALTER TABLE "FederalLogisticsInformationSystem" ADD CONSTRAINT "FederalLogisticsInformationSystem_pscCode_fkey" FOREIGN KEY ("pscCode") REFERENCES "PscClass"("psc") ON DELETE CASCADE ON UPDATE CASCADE;
