import { and, count, eq } from "drizzle-orm";
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
  FlockDetailsActions,
  FlockMembers,
  FlockMemberVotes,
  Flocks,
  Posts,
  Users,
} from "./db/src/schema";
import { PostCreationSchema } from "./validation";

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
            eq(FlockActions.creator, user.userInfo.user.id),
          ),
        );

      if (outstandingSession)
        throw new UploadThingError("You already created an active session");

      const [members] = await db
        .select({ count: count(FlockMembers.userId) })
        .from(FlockMembers)
        .where(eq(FlockMembers.flockId, user.userInfo.flock.id));

      const [{ insertId: actionId }] = await db.insert(FlockActions).values({
        type: "UPDATE PICTURE",
        flockId: user.userInfo.flock.id,
        creator: user.userInfo.user.id,
        publicId: nanoid(16),
        ...(members.count === 1 ? { open: false, accepted: true } : {}),
      });
      await db.insert(FlockMemberVotes).values({
        actionId,
        vote: true,
        userId: user.userInfo.user.id,
        publicId: nanoid(16),
      });

      return {
        flockId: user.userInfo.flock.id,
        actionId,
        members: members.count,
      };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      await db
        .insert(FlockDetailsActions)
        .values({ actionId: metadata.actionId, picture: [file.url] });

      if (metadata.members === 1)
        await db
          .update(Flocks)
          .set({ picture: file.url })
          .where(eq(Flocks.id, metadata.flockId));
    }),
  flockPostCreation: f({
    image: {
      maxFileCount: 6,
    },
  })
    .input(PostCreationSchema)
    .middleware(async ({ req, input }) => {
      const user = await getServerSession(req);
      if (!user?.userInfo.flock) throw new UploadThingError("No user found");

      const [members] = await db
        .select({ count: count(FlockMembers.userId) })
        .from(FlockMembers)
        .where(eq(FlockMembers.flockId, user.userInfo.flock.id));

      const [{ insertId: actionInsertId }] = await db
        .insert(FlockActions)
        .values({
          flockId: user.userInfo.flock.id,
          type: "CREATE POST",
          creator: user.userInfo.user.id,
          publicId: nanoid(16),
          ...(members.count === 1 ? { open: false, accepted: true } : {}),
        });
      await db.insert(FlockMemberVotes).values({
        vote: true,
        userId: user.userInfo.user.id,
        actionId: actionInsertId,
        publicId: nanoid(16),
      });
      await db.insert(FlockDetailsActions).values({
        actionId: actionInsertId,
        description: input.description,
        picture: [],
      });

      let postInsertId = null;
      if (members.count === 1) {
        const [{ insertId }] = await db.insert(Posts).values({
          flockId: user.userInfo.flock.id,
          picture: [],
          description: input.description,
          publicId: nanoid(16),
        });

        postInsertId = insertId;
      }

      return { actionInsertId, members: members.count, postInsertId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      const [action] = await db
        .select()
        .from(FlockDetailsActions)
        .where(eq(FlockDetailsActions.actionId, metadata.actionInsertId));
      await db
        .update(FlockDetailsActions)
        .set({ picture: [...action.picture!, file.url] })
        .where(eq(FlockDetailsActions.actionId, metadata.actionInsertId));

      if (metadata.members === 1)
        await db
          .update(Posts)
          .set({ picture: [...action.picture!, file.url] })
          .where(eq(Posts.id, metadata.postInsertId!));
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
