-- CreateTable
CREATE TABLE "PscClass" (
    "psc" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inclusions" TEXT,
    "exclusions" TEXT,
    "notes" TEXT,
    "isSupplyTigerPsc" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PscClass_pkey" PRIMARY KEY ("psc")
);

-- CreateTable
CREATE TABLE "NationalStockNumber" (
    "id" TEXT NOT NULL,
    "nsn" TEXT NOT NULL,
    "niin" TEXT NOT NULL,
    "pscCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "characteristics" TEXT,
    "commonName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NationalStockNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialItemDesc" (
    "id" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "date" TEXT,
    "description" TEXT NOT NULL,
    "qaPkg" TEXT,
    "qaPkgDate" TEXT,
    "pscCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialItemDesc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PscClass_isSupplyTigerPsc_idx" ON "PscClass"("isSupplyTigerPsc");

-- CreateIndex
CREATE UNIQUE INDEX "NationalStockNumber_nsn_key" ON "NationalStockNumber"("nsn");

-- CreateIndex
CREATE INDEX "NationalStockNumber_pscCode_idx" ON "NationalStockNumber"("pscCode");

-- CreateIndex
CREATE INDEX "NationalStockNumber_itemName_idx" ON "NationalStockNumber"("itemName");

-- CreateIndex
CREATE INDEX "NationalStockNumber_commonName_idx" ON "NationalStockNumber"("commonName");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialItemDesc_cid_key" ON "CommercialItemDesc"("cid");

-- CreateIndex
CREATE INDEX "CommercialItemDesc_pscCode_idx" ON "CommercialItemDesc"("pscCode");

-- AddForeignKey
ALTER TABLE "NationalStockNumber" ADD CONSTRAINT "NationalStockNumber_pscCode_fkey" FOREIGN KEY ("pscCode") REFERENCES "PscClass"("psc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialItemDesc" ADD CONSTRAINT "CommercialItemDesc_pscCode_fkey" FOREIGN KEY ("pscCode") REFERENCES "PscClass"("psc") ON DELETE CASCADE ON UPDATE CASCADE;
