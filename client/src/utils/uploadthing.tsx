import { generateReactHelpers } from "@uploadthing/react";
import { UploadRouter } from "~/server/uploadthing";
 
export const { useUploadThing, uploadFiles } = generateReactHelpers<UploadRouter>({
  url: "http://localhost:3000/api/uploadthing",
});
