import { Hono } from "hono";

import { appRouter } from "./routers/appRouter.ts";

import "./env.ts";

import { getCookie } from "hono/cookie";
import { Session, User, verifyRequestOrigin } from "lucia";

import login from "./api/login";
import { lucia } from "./auth/auth.ts";
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
    return await next();
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
  await next();
});

hono.use(async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return await next();
  }
  const { session, user } = await lucia.validateSession(sessionId ?? "");
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
  c.set("user", user);
  c.set("session", session);

  await next();
});

hono.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

// base routes
hono.get("/test", async (c) => {
  console.log(c.get("user")?.email);
  return c.text("No");
});

// external routes
hono.route("api/login", login);

hono.notFound((c) => {
  return c.text("Nothing Here", 404);
});

console.log("Server running on port 3000");

export default hono;
