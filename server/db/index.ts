import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  database: "flock",
  password: "flockpassword",
});

export const db = drizzle(connection);
