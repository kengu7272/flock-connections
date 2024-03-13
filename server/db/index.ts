import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import "dotenv/config";

const connection = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: 3306,
  user: process.env.DATABASE_USERNAME,
  database: process.env.DATABASE,
  password: process.env.DATABASE_PASSWORD,
});

export const db = drizzle(connection);
