import { Hono } from "hono";
import { createRouteHandler } from "uploadthing/server";

import { lucia } from "../auth";
import { Flock, Session, User } from "../db/src/types";
import { uploadRouter } from "../uploadthing.ts";
import login from "./login.ts";

const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});

const hono = new Hono<{
  Variables: {
    user: User | null;
    flock: Flock | null;
    session: Session | null;
  };
}>();

//uploadthing
const ut = hono
  .get("/", (context) => GET(context.req.raw))
  .post("/", (context) => POST(context.req.raw));
hono.route("/uploadthing", ut);

//routes
hono.get("/logout", async (c) => {
  await lucia.invalidateSession(c.get("session")?.id ?? "");
  c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
    append: true,
  });
  return c.redirect("/");
});

// external routes
hono.route("/login", login);

export default hono;
