import { Google } from "arctic";
import { Lucia } from "lucia";

import { adapter } from "../db/src/schema";

export interface DatabaseUserAttributes {
  id: string;
  username: string | undefined;
  email: string;
  picture: string;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: Date;
	fresh: boolean;
}

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      email: attributes.email,
      picture: attributes.picture,
      username: attributes.username,
    }
  }
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

// providers
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/login/google/callback",
);
