import { defineConfig } from "prisma/config";
import { ENV } from "../config/env.js";

// TODO: initialize db via migration scripts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "",
  },
  datasource: {
    url: ENV.DATABASE_URL,
  },
});
