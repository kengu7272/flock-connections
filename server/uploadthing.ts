import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  flockImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(({ req }) => {
      return { yes: true };
    })
    .onUploadComplete((data) => {}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
