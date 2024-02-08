import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db";
import { Users, Session, } from "../db/src/schema";
import { Lucia } from "lucia";

const adapter = new DrizzleMySQLAdapter(db, Session, Users)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production"
    }
  }
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}
