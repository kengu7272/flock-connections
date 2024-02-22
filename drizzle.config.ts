import { defineConfig } from 'drizzle-kit'

export default defineConfig({
 schema: "./server/db/src/schema.ts",
  driver: 'mysql2',
  dbCredentials: {
    uri: `mysql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/flock_connection?ssl={"rejectUnauthorized":true}`
  },
  verbose: true,
  strict: true,
})
