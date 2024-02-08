import { sql } from "drizzle-orm";
import { char, datetime, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const Users = mysqlTable("user", {
  id: char("id", { length: 36 }).primaryKey(),
  firstName: varchar("firstName", { length: 35 }),
  lastName: varchar("lastName", { length: 35 }),
  email: varchar("email", { length: 255 }),
  joined: datetime("joined", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const Session = mysqlTable("session", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("userId", { length: 36 }).primaryKey(),
  expiresAt: datetime("expiresAt", { mode: "date" }).notNull(),
});

