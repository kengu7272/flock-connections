import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  datetime,
  json,
  mysqlEnum,
  mysqlTable,
  serial,
  text,
  unique,
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
const Actions = [
  "UPDATE PICTURE",
  "UPDATE DESCRIPTION",
  ...MemberActions,
  "CREATE POST",
  "EDIT POST",
  "DELETE POST"
] as const;
export const FlockActions = mysqlTable("flockAction", {
  id: serial("id").primaryKey(),
  publicId: varchar("publicId", { length: 16 }).unique().notNull(),
  flockId: bigint("flockId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Flocks.id, { onDelete: "cascade" }),
  creator: bigint("creator", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", Actions).notNull(),
  open: boolean("open").notNull().default(true),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: datetime("createdAt", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const FlockMemberActions = mysqlTable("flockMemberAction", {
  actionId: bigint("actionId", { mode: "number", unsigned: true })
    .references(() => FlockActions.id, { onDelete: "cascade" })
    .primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }) // who the action pertains to (ex. inviting this user)
    .notNull()
    .references(() => Users.id, { onDelete: "cascade" }),
  accepted: boolean("accepted").notNull().default(false),
  outstanding: boolean("outstanding").notNull().default(true),
});

export const FlockDetailsActions = mysqlTable("flockDetailAction", {
  actionId: bigint("actionId", { mode: "number", unsigned: true })
    .references(() => FlockActions.id, { onDelete: "cascade" })
    .primaryKey(),
  relevantId: bigint("relevantId", { mode: "number", unsigned: true }), // pertaining id such as post pub id
  picture: json("picture").$type<string[]>(),
  description: varchar("description", { length: 500 }),
});

export const FlockMemberVotes = mysqlTable(
  "flockMemberVote",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 16 }).unique().notNull(),
    actionId: bigint("actionId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => FlockActions.id, { onDelete: "cascade" }),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .references(() => Users.id, { onDelete: "cascade" })
      .notNull(),
    vote: boolean("vote").notNull(),
    createdAt: datetime("createdAt", { mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({ unq: unique().on(table.actionId, table.userId) }),
);

export const Posts = mysqlTable("post", {
  id: serial("id").primaryKey(),
  publicId: varchar("publicId", { length: 16 }).unique().notNull(),
  flockId: bigint("flockId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => Flocks.id, { onDelete: "cascade" }),
  picture: json("picture").$type<string[]>().notNull(),
  description: varchar("description", { length: 500 }),
  likes: bigint("likes", { unsigned: true, mode: "number" })
    .default(0)
    .notNull(),
  createdAt: datetime("createdAt", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const PostLikes = mysqlTable(
  "postLike",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("publicId", { length: 16 }).unique().notNull(),
    postId: bigint("postId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => Posts.id, { onDelete: "cascade" }),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => Users.id, { onDelete: "cascade" }),
  },
  (table) => ({ unq: unique().on(table.postId, table.userId) }),
);

export const adapter = new DrizzleMySQLAdapter(db, Sessions, ProviderAccounts);
