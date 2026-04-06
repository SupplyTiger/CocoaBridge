-- AlterTable: drop notes column from InboxItem
ALTER TABLE "public"."InboxItem" DROP COLUMN IF EXISTS "notes";

-- CreateTable: InboxItemNote
CREATE TABLE "public"."InboxItemNote" (
    "id" TEXT NOT NULL,
    "inboxItemId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxItemNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboxItemNote_inboxItemId_createdAt_idx" ON "public"."InboxItemNote"("inboxItemId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."InboxItemNote" ADD CONSTRAINT "InboxItemNote_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "public"."InboxItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InboxItemNote" ADD CONSTRAINT "InboxItemNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
