import {
  generateCodeVerifier,
  generateState,
  OAuth2RequestError,
} from "arctic";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { google, lucia } from "../auth";
import { db } from "../db";
import { Users } from "../db/src/schema";
import { z } from "zod";

const hono = new Hono();

hono.get("/google", async (c) => {
  if (c.var.user) return c.redirect("/");

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

    const userType = z.object({
      sub: z.string(),
      picture: z.string(),
      email: z.string(),
    })

    const user = userType.safeParse(await response.json());
    if(!user.success) 
      return c.status(400);

    const [existingUser] = await db
      .select()
      .from(Users)
      .where(eq(Users.id, user.data.sub));

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": sessionCookie.serialize(),
        },
      });
    }

    await db
      .insert(Users)
      .values({ id: user.data.sub, email: user.data.email, picture: user.data.picture });

    const session = await lucia.createSession(user.data.sub, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  } catch (e) {
    console.log(e);
    if (e instanceof OAuth2RequestError) {
      // bad verification code, invalid credentials, etc
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
});

export default hono;
