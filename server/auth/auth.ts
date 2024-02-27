import { Lucia } from "lucia";
import { Google } from "arctic";
import { adapter } from "../db/src/schema";

interface DatabaseUserAttributes {
  id: string;
  username: string | undefined;
  email: string;
  picture: string;
}


export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production"
    }, 
  }
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

// providers
export const google = new Google(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "http://localhost:3000/api/login/google/callback")
