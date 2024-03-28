import { Hono } from "hono";

import { lucia } from "../auth";
import { Flock, Session, User } from "../db/src/types";
import login from "./login.ts";

const hono = new Hono<{
  Variables: {
    user: User | null;
    flock: Flock | null;
    session: Session | null;
  };
}>();

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
