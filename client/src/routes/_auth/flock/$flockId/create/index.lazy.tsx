import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useDropzone } from "@uploadthing/react";
import clsx from "clsx";
import { FolderUp, Loader2, XCircle } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { generateClientDropzoneAccept } from "uploadthing/client";

import { useUploadThing } from "~/client/src/utils/uploadthing";
import {
  PostCreationSchema,
  PostCreationSchemaType,
} from "~/server/validation";

export const Route = createLazyFileRoute("/_auth/flock/$flockId/create/")({
  component: Create,
});

function Create() {
  const navigate = useNavigate();
  const { flockId } = Route.useParams();

  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const [progress, setProgress] = useState(0);
  const { startUpload, permittedFileInfo, isUploading } = useUploadThing(
    "flockPostCreation",
    {
      onClientUploadComplete: () => {
        toast.success("Post Creation Session Created");
        setFiles([]);
        navigate({ to: "/flock/" + flockId})
      },
      onUploadError: (e) => {
        toast.error(e.message);
      },
      onUploadProgress: (p) => {
        setProgress(p);
      },
    },
  );

  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo?.config)
    : [];

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    maxFiles: 6,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostCreationSchemaType>({
    resolver: zodResolver(PostCreationSchema),
  });

  const onSubmit: SubmitHandler<PostCreationSchemaType> = ({ description }) => {
    startUpload(files, { description });
  };

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 py-6 lg:w-3/5 xl:w-2/5">
        <h1 className="text-center text-2xl font-bold">Post Creation</h1>

        <form
          className="mx-auto w-[90%] space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <label>Description</label>
            <textarea
              className="h-12 min-h-24 flex-grow rounded-lg bg-slate-800 p-2 text-white focus:outline-none"
              placeholder="Provide an optional description"
              {...register("description")}
            />
            {errors.description && (
              <span className="text-sm text-red-500">
                {errors.description.message}
              </span>
            )}
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-2 text-slate-50">
            <div
              className="relative flex h-32 w-full cursor-pointer items-center justify-center rounded-lg bg-slate-800"
              {...getRootProps()}
            >
              <div
                style={{ width: `${progress}%` }}
                className="absolute bottom-0 left-0 top-0 z-0 h-full bg-slate-600/90 transition-[width]"
              />
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="z-10 flex items-center justify-center gap-4 text-sm">
                  <Loader2
                    strokeWidth={1.25}
                    className="h-9 w-9 animate-spin"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <span>
                      Uploading {files.length} File{files.length > 1 && "s"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="z-10 flex items-center justify-center gap-4 text-sm">
                  <FolderUp strokeWidth={1.25} className="h-9 w-9" />
                  <div className="flex flex-col items-center justify-center">
                    <span>
                      {files.length
                        ? `${files.length} File${files.length > 1 ? "s" : ""}`
                        : "Upload Content"}
                    </span>
                    {!files.length && <span>Max 5 Images + 1 Video</span>}
                    {!files.length && <span>(4 MB)</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="ml-auto flex w-fit gap-2">
              {!!files.length && !isUploading && (
                <button
                  className="flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium"
                  disabled={files.length === 0 || isUploading}
                  onClick={() => setFiles([])}
                >
                  <XCircle className="h-4 w-4" />
                  Clear Files
                </button>
              )}
              <input
                type="submit"
                className={clsx({
                  "inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 py-2 transition-colors":
                    true,
                  "opacity-50": files.length === 0,
                  "active:bg-slate-700 enabled:hover:bg-sky-600":
                    files.length > 0,
                })}
                disabled={files.length === 0 || isUploading}
                value={isUploading ? "Uploading" : "Create Session"}
              />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

