import { Google } from "arctic";
import { Lucia, } from "lucia";

import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../db";
import {
  adapter,
  FlockMembers,
  Flocks,
  ProviderAccounts,
  Users,
} from "../db/src/schema";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}

// providers
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/login/google/callback",
);

// server session 
// don't need to set cookies, middleware before every route
// already handles that, this is mainly for uploadthing routes currently
export const getServerSession = async (request: Request) => {
  const cookieHeader = request.headers.get("Cookie");
  const sessionId = lucia.readSessionCookie(cookieHeader ?? "");
  if (!sessionId) {
    return null;
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) {
    return null;
  }

  const [userInfo] = await db
    .select({ user: Users, flock: Flocks })
    .from(Users)
    .innerJoin(ProviderAccounts, eq(ProviderAccounts.userId, Users.id))
    .leftJoin(FlockMembers, eq(FlockMembers.userId, Users.id))
    .leftJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
    .where(eq(ProviderAccounts.id, user?.id ?? ""));

  return { userInfo: userInfo ?? null, session: session ?? null };
};

