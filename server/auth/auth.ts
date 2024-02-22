import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../db";
import { Users, Sessions, } from "../db/src/schema";
import { Lucia } from "lucia";
import { Google } from "arctic";

interface DatabaseUserAttributes {
  id: string;
  username: string | undefined;
  email: string;
}

const adapter = new DrizzleMySQLAdapter(db, Sessions, Users)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production"
    }, 
  }
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

export const google = new Google(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "http://localhost:3000/api/login/google/callback")
