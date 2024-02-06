import { drizzle } from "drizzle-orm/planetscale-serverless";
import { Client } from "@planetscale/database";

// create the connection
const connection = new Client({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

// @ts-expect-error
const db = drizzle(connection);
