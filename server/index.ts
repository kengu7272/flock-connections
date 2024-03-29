import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { Session, verifyRequestOrigin } from "lucia";
import { createRouteHandler } from "uploadthing/server";

import base from "./api/base";
import { appRouter } from "./api/routers/appRouter.ts";
import { lucia } from "./auth";
import { db } from "./db/index.ts";
import {
  FlockMembers,
  Flocks,
  ProviderAccounts,
  Users,
} from "./db/src/schema.ts";
import { Flock, User } from "./db/src/types.ts";
import { trpcServer } from "./trpc.ts";
import { uploadRouter } from "./uploadthing.ts";

const hono = new Hono<{
  Variables: {
    user: User | null;
    flock: Flock | null;
    session: Session | null;
  };
}>();

// middleware
hono.use("/api/*", async (c, next) => {
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
hono.use("/api/*", async (c, next) => {
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
    .select({ user: Users, flock: Flocks })
    .from(Users)
    .innerJoin(ProviderAccounts, eq(ProviderAccounts.userId, Users.id))
    .leftJoin(FlockMembers, eq(FlockMembers.userId, Users.id))
    .leftJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
    .where(eq(ProviderAccounts.id, user?.id ?? ""));

  c.set("user", dbUser?.user ?? null);
  c.set("flock", dbUser.flock ?? null);
  c.set("session", session);

  return next();
});
hono.use(
  "api/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

// routes
hono.route("/api", base);

const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});

//uploadthing
hono.get("/uploadthing", (context) => GET(context.req.raw));
hono.post("/uploadthing", (context) => POST(context.req.raw));

hono.notFound((c) => {
  return c.text("Nothing Here", 404);
});

console.log("Server running on port 3000");

export default hono;
