import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sql } from "drizzle-orm";
import {
  bigint,
  datetime,
  mysqlTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

import { db } from "..";

export const Users = mysqlTable("user", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 24 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  joined: datetime("joined", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  picture: text("picture").default("").notNull(),
  bio: varchar("bio", { length: 255 }),
});

export const ProviderAccounts = mysqlTable("providerAccount", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique()
    .references(() => Users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 255 }).notNull(),
});

export const Sessions = mysqlTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => ProviderAccounts.id, { onDelete: "cascade" }),
  expiresAt: datetime("expiresAt", { mode: "date" }).notNull(),
});

// Flocks
export const Flocks = mysqlTable("flock", {
  id: serial("id").primaryKey(),
  picture: text("picture").default("").notNull(),
  name: varchar("name", { length: 24 }).unique().notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  createdAt: datetime("createdAt", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const FlockMembers = mysqlTable("flockMember", {
  userId: bigint("userId", { mode: "number", unsigned: true })
    .primaryKey()
    .references(() => Users.id, { onDelete: "cascade" }),
  flockId: bigint("flockId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Flocks.id, { onDelete: "cascade" }),
});

export const adapter = new DrizzleMySQLAdapter(db, Sessions, ProviderAccounts);
