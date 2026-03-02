-- CreateTable
CREATE TABLE "AppConfig" (
    "key" TEXT NOT NULL,
    "values" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("key")
);
