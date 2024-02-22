import { sql } from "drizzle-orm";
import { datetime, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export const Users = mysqlTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  username: varchar("username", { length: 16}).unique(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  joined: datetime("joined", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  picture: text("picture"),
});

export const Sessions = mysqlTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 }).unique().notNull(),
  expiresAt: datetime("expiresAt", { mode: "date" }).notNull(),
});
