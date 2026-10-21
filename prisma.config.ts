import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma Migrate uses DIRECT_URL (direct or session-mode connection), not the
// pooled DATABASE_URL used by the application at runtime.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
