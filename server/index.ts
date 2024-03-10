import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Session, verifyRequestOrigin } from "lucia";

import base from "./api/base";
import { lucia } from "./auth";
import { db } from "./db/index.ts";
import { ProviderAccounts, Users } from "./db/src/schema.ts";
import { User } from "./db/src/types.ts";
import { appRouter } from "./routers/appRouter.ts";
import { trpcServer } from "./trpc.ts";

const hono = new Hono<{
  Variables: {
    user: User | null;
    session: Session | null;
  };
}>();

// middleware
hono.use("*", async (c, next) => {
  // CSRF middleware
  if (c.req.method === "GET") {
    return next();
  }
  const originHeader = c.req.header("Origin");
  // NOTE: You may need to use `X-Forwarded-Host` instead
  const hostHeader = c.req.header("Host");
  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader])
  ) {
    return c.body(null, 403);
  }
  return next();
});
hono.use("*", async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    // use `header()` instead of `setCookie()` to avoid TS errors
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }
  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }

  const [dbUser] = await db
    .select({ user: Users })
    .from(Users)
    .innerJoin(ProviderAccounts, eq(ProviderAccounts.userId, Users.id))
    .where(eq(ProviderAccounts.id, user?.id ?? ""));

  c.set("user", dbUser?.user ?? null);
  c.set("session", session);

  return next();
});
hono.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

// routes
hono.route("/api", base);

hono.notFound((c) => {
  return c.text("Nothing Here", 404);
});

console.log("Server running on port 3000");

export default hono;
