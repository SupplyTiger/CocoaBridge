-- Data cleanup: delete inbox items linked to industry day opportunities
DELETE FROM "public"."InboxItem"
WHERE "opportunityId" IN (
  SELECT "id" FROM "public"."Opportunity" WHERE "tag" = 'INDUSTRY_DAY'
);

-- Drop the industryDayId foreign key, index, and column from InboxItem
ALTER TABLE "public"."InboxItem" DROP CONSTRAINT IF EXISTS "InboxItem_industryDayId_fkey";
DROP INDEX IF EXISTS "public"."InboxItem_industryDayId_idx";
ALTER TABLE "public"."InboxItem" DROP COLUMN "industryDayId";
