import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["error", "warn"], // add "query" only in dev if needed
});
