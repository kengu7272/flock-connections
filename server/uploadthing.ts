import { eq } from "drizzle-orm";
import {
  createUploadthing,
  UploadThingError,
  type FileRouter,
} from "uploadthing/server";

import { getServerSession } from "./auth";
import { db } from "./db";
import { Users } from "./db/src/schema";

const f = createUploadthing();

export const uploadRouter = {
  flockImage: f({
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
      await db
        .update(Users)
        .set({ picture: file.url })
        .where(eq(Users.id, metadata.userId));
    //@TODO 
    //Delete file (if exists) on uploadthing
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
