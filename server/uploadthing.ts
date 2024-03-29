import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  createUploadthing,
  UploadThingError,
  UTApi,
  type FileRouter,
} from "uploadthing/server";

import { getServerSession } from "./auth";
import { db } from "./db";
import {
  FlockActions,
  FlockImageActions,
  FlockMemberVotes,
  Users,
} from "./db/src/schema";

export const utapi = new UTApi();

const f = createUploadthing();

export const uploadRouter = {
  profileImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await getServerSession(req);
      if (!user?.userInfo) throw new UploadThingError("No user found");

      return { userId: user?.userInfo.user.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const [pictureUrl] = await db
        .select({ url: Users.picture })
        .from(Users)
        .where(eq(Users.id, metadata.userId));
      await db
        .update(Users)
        .set({ picture: file.url })
        .where(eq(Users.id, metadata.userId));
      const key = pictureUrl.url.substring(pictureUrl.url.indexOf("/f/") + 3); // we don't store the key so construct it
      utapi.deleteFiles(key);
      return { imageUrl: file.url };
    }),
  flockImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await getServerSession(req);
      if (!user?.userInfo.flock) throw new UploadThingError("No user found");

      const [outstandingSession] = await db
        .select()
        .from(FlockActions)
        .where(
          and(
            eq(FlockActions.flockId, user.userInfo.flock.id),
            eq(FlockActions.type, "UPDATE PICTURE"),
            eq(FlockActions.open, true),
          ),
        );

      if (outstandingSession)
        throw new UploadThingError("You already created an active session");

      const [{ insertId: actionId }] = await db.insert(FlockActions).values({
        type: "UPDATE PICTURE",
        flockId: user.userInfo.flock.id,
        creator: user.userInfo.user.id,
        publicId: nanoid(16),
      });
      await db
        .insert(FlockMemberVotes)
        .values({ actionId, vote: true, userId: user.userInfo.user.id });

      return { flockId: user.userInfo.flock.id, actionId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      await db
        .insert(FlockImageActions)
        .values({ actionId: metadata.actionId, picture: file.url });
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
