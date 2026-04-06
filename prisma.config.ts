import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "Backend/prisma/schema.prisma",
  migrations: {
    path: "Backend/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
