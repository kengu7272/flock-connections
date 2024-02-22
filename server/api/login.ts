import {
  generateCodeVerifier,
  generateState,
  OAuth2RequestError,
} from "arctic";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { google, lucia } from "../auth/auth";
import { db } from "../db";
import { Users } from "../db/src/schema";

const hono = new Hono();

hono.get("/google", async (c) => {
  const verifier = generateCodeVerifier();
  const state = generateState();
  const url = await google.createAuthorizationURL(state, verifier, {
    scopes: ["email"],
  });

  setCookie(c, "google_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
  });
  setCookie(c, "code_verifier", verifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
  });

  return c.redirect(url.toString());
});

hono.get("/google/callback", async (c) => {
  const cookies = getCookie(c);
  const stateCookie = cookies["google_oauth_state"] ?? null;
  const codeVerifier = cookies["code_verifier"] ?? null;

  const state = c.req.query("state");
  const code = c.req.query("code");

  // verify state
  if (
    !state ||
    !stateCookie ||
    !code ||
    stateCookie !== state ||
    !codeVerifier
  ) {
    c.status(400);
    return c.body("Internal Server Error(s)");
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      },
    );

    const user = (await response.json()) as {
      sub: string;
      picture: string;
      email: string;
    };

    const session = await lucia.createSession(user.sub, {
      id: user.sub,
      email: user.email,
      username: undefined,
    });
    const sessionCookie = lucia.createSessionCookie(session.id);
    setCookie(c, sessionCookie.name, sessionCookie.value, {
      ...sessionCookie.attributes,
      sameSite: sessionCookie.attributes.sameSite
        ? ((sessionCookie.attributes.sameSite[0].toUpperCase() +
            sessionCookie.attributes.sameSite.slice(1)) as
            | "Lax"
            | "Strict"
            | "None")
        : undefined,
    });

    const [existingUser] = await db
      .select()
      .from(Users)
      .where(eq(Users.id, user.sub));
    if (existingUser) return c.redirect("/");

    await db
      .insert(Users)
      .values({ id: user.sub, email: user.email, picture: user.picture });

    return c.redirect("/");
  } catch (e) {
    if(e instanceof Error) console.log(e.message);

    if (e instanceof OAuth2RequestError) {
      // bad verification code, invalid credentials, etc
      c.status(400);
      return c.text("Bad verification code or invalid credentials");
    }

    c.status(500);
    return c.text("Internal Server Error");
  }
});

export default hono;
