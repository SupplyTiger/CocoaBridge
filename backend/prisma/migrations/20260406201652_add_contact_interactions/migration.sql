-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('SENT', 'RESPONDED', 'NO_REPLY', 'FOLLOW_UP', 'MEETING_SCHEDULED', 'CLOSED');

-- CreateTable
CREATE TABLE "ContactInteraction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactInteraction_contactId_loggedAt_idx" ON "ContactInteraction"("contactId", "loggedAt");

-- AddForeignKey
ALTER TABLE "ContactInteraction" ADD CONSTRAINT "ContactInteraction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactInteraction" ADD CONSTRAINT "ContactInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
