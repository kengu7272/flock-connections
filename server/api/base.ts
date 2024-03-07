import { Hono } from "hono";
import { lucia } from "../auth";
import { Session, User } from "../db/src/types";
import login from './login.ts';

const hono = new Hono<{
  Variables: {
    user: User | null;
    session: Session | null;
  };
}>();

hono.get("/logout", async (c) => {
  await lucia.invalidateSession(c.get("session")?.id ?? "");
  c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
    append: true,
  });
  return c.redirect("/");
});

hono.get("/loggedIn", async (c) => {
  if(c.get("user"))
    return c.body(null, 200);  

  return c.body(null, 400);
})

// external routes
hono.route("/login", login)

export default hono;
