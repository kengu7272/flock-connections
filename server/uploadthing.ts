import { eq } from "drizzle-orm";
import {
  createUploadthing,
  UploadThingError,
  UTApi,
  type FileRouter,
} from "uploadthing/server";

import { getServerSession } from "./auth";
import { db } from "./db";
import { Users } from "./db/src/schema";

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
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
