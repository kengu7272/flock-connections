import { createUploadthing, type FileRouter } from "uploadthing/server";
import { getServerSession } from "./auth";

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
    console.log(user)
      return { yes: true };
    })
    .onUploadComplete((data) => {}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
