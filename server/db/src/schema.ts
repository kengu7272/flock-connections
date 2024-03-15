import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  datetime,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  serial,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

import { db } from "..";

export const Users = mysqlTable("user", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 16 }).unique().notNull(),
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

const MemberActions = ["INVITE", "KICK"] as const;
export const FlockMemberActions = mysqlTable("flockMemberActions", {
  id: serial("id").primaryKey(),
  publicId: varchar("publicId", { length: 16 }).unique().notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }) // who the action pertains to (ex. inviting this user)
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  flockId: bigint("flockId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Flocks.id, { onDelete: "cascade" }),
  creator: bigint("creator", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", MemberActions).notNull(),
  active: boolean("status").notNull().default(true),
});

export const FlockMemberVotes = mysqlTable(
  "flockMemberVotes",
  {
    actionId: bigint("actionId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => FlockMemberActions.id, { onDelete: "cascade" }),
    userId: bigint("userId", { mode: "number", unsigned: true }).references(
      () => Users.id,
      { onDelete: "cascade" },
    ),
    vote: boolean("vote").notNull(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.actionId, table.userId] }) }),
);

export const adapter = new DrizzleMySQLAdapter(db, Sessions, ProviderAccounts);
