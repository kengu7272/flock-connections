import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import "dotenv/config";

// create the connection
const connection = new Client({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

// @ts-expect-error because drizzle implements it wrong
export const db = drizzle(connection);
