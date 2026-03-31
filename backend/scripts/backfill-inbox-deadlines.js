import prisma from "../src/config/db.js";

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "InboxItem"
    SET deadline = o."responseDeadline"
    FROM "Opportunity" o
    WHERE "InboxItem"."opportunityId" = o.id
      AND "InboxItem".deadline IS NULL
  `;
  console.log(`Updated ${result} inbox item(s) with opportunity deadlines.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
