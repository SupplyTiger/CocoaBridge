-- Drop the existing SetNull FK and replace with Cascade so that
-- deleting an Opportunity automatically removes its linked InboxItems,
-- preventing orphaned rows.

ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_opportunityId_fkey";

ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
