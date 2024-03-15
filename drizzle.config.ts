import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/src/schema.ts",
  driver: "mysql2",
  dbCredentials: {
    host: "localhost",
    port: 3306,
    user: "root",
    database: "flock",
    password: "flockpassword",
  },
  verbose: true,
  strict: true,
});
