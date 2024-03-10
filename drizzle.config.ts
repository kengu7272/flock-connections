import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/src/schema.ts",
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
