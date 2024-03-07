import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { bigint, datetime, mysqlTable, serial, text, varchar } from "drizzle-orm/mysql-core";
import { db } from "..";
import { sql } from "drizzle-orm";

export const Users = mysqlTable("user", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 24}).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  joined: datetime("joined", { mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  picture: text("picture"),
  bio: varchar("bio", { length: 255 }),
})

export const ProviderAccounts = mysqlTable("providerAccount", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
  provider: varchar("provider", { length: 255 }).notNull(),
});

export const Sessions = mysqlTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  expiresAt: datetime("expiresAt", { mode: "date" }).notNull(),
});

export const adapter = new DrizzleMySQLAdapter(db, Sessions, ProviderAccounts)
