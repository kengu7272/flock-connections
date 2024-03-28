import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useDropzone } from "@uploadthing/react";
import clsx from "clsx";
import { FolderUp, Loader2, XCircle } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { generateClientDropzoneAccept } from "uploadthing/client";

import { useUploadThing } from "~/client/src/utils/uploadthing";
import { trpc } from "~/client/utils/trpc";
import { ProfileSchema, ProfileSchemaType } from "~/server/validation";

export const Route = createLazyFileRoute("/_auth/profile/")({
  component: Profile,
});

function Profile() {
  const { userInfo: initialUserInfo, flock: initialFlock } = Route.useLoaderData();

  const userInfo = trpc.user.userInfo.useQuery(undefined, { initialData: initialUserInfo });
  const flock = trpc.user.getFlock.useQuery(undefined, { initialData: initialFlock });
  const utils = trpc.useContext();

  const [profilePicture, setProfilePicture] = useState(userInfo.data?.picture ?? "");

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      userInfo.refetch();
      utils.base.loggedIn.invalidate();
      toast.success("Updated Profile Successfully");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(ProfileSchema),
  });

  const onSubmit: SubmitHandler<ProfileSchemaType> = (data) => {
    if (!data.username?.length && !data.bio?.length) {
      toast.error("Nothing to be changed");
      return;
    }

    updateProfile.mutate({
      ...(data.username?.length ? { username: data.username } : {}),
      ...(data.bio?.length ? { bio: data.bio } : {}),
    });
  };

  const removeBio = trpc.user.clearBio.useMutation({
    onSuccess: () => {
      toast.success("Bio Removed");
      userInfo.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [selectPicture, setSelectPicture] = useState(false);

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 py-6 lg:w-3/5 xl:w-2/5">
        <span className="block w-full text-center text-2xl font-bold">
          Edit Profile
        </span>
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full flex-col items-center gap-4 px-2 lg:px-20">
            <img
              onClick={() => setSelectPicture((prev) => !prev)}
              src={profilePicture}
              className="h-16 w-16 rounded-full duration-200 hover:scale-110"
              alt="Profile Picture"
            />
            {selectPicture && (
              <div className="flex w-full flex-col items-center gap-y-2">
                <span className="font-semibold">
                  Upload a new Profile Picture
                </span>
                <Uploader setProfilePicture={setProfilePicture} />
              </div>
            )}
          </div>
          <span className="text-lg font-semibold">
            {userInfo.data?.username}
          </span>
          {flock.data && (
            <span className="font-semibold">{flock.data.flock.name}</span>
          )}
          <span className="text-sm">{userInfo.data?.email}</span>
          <span className="text-sm">
            Joined {userInfo.data?.joined.toDateString()}
          </span>
          <p className="w-3/4 text-center text-sm text-slate-300">
            {userInfo.data?.bio}
          </p>
        </div>
        <form
          className="mx-auto w-[90%] space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <label>Username (No Spaces)</label>
            <input
              className="h-12 flex-grow rounded-lg bg-slate-800 p-2 text-white focus:outline-none"
              placeholder={userInfo.data?.username}
              {...register("username")}
            />
            {errors.username && (
              <span className="text-sm text-red-500">
                {errors.username.message}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label>Bio</label>
            <textarea
              className="h-12 min-h-24 flex-grow rounded-lg bg-slate-800 p-2 text-white focus:outline-none"
              placeholder={userInfo.data?.bio ?? ""}
              {...register("bio")}
            />
            {errors.bio && (
              <span className="text-sm text-red-500">{errors.bio.message}</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                removeBio.mutate();
              }}
              className="mx-auto w-fit rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-700 active:bg-red-800"
            >
              Remove Bio
            </button>
          </div>
          <input
            type="submit"
            value="Update"
            className="ml-auto block h-12 rounded-lg bg-sky-600 px-3 py-2 text-white hover:bg-sky-700 active:bg-sky-800 disabled:opacity-75"
          />
        </form>
        <div />
      </main>
    </div>
  );
}

function Uploader({ setProfilePicture }: { setProfilePicture: React.Dispatch<React.SetStateAction<string>>} ) {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const [progress, setProgress] = useState(0);
  const { startUpload, permittedFileInfo, isUploading } = useUploadThing(
    "profileImage",
    {
      onClientUploadComplete: (res) => {
        toast.success("Profile Picture Updated");
        setProfilePicture(res[0].serverData.imageUrl);
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
  });

  return (
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
            <Loader2 strokeWidth={1.25} className="h-9 w-9 animate-spin" />
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
                  : "Upload your file"}
              </span>
              {!files.length && <span>(4 MB)</span>}
            </div>
          </div>
        )}
      </div>
      <div className="flex w-fit flex-col justify-end gap-2">
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
        <button
          onClick={() => startUpload(files)}
          className={clsx({
            "inline-flex items-center gap-2 rounded-md bg-sky-500 px-5 py-2 transition-colors":
              true,
            "opacity-50": files.length === 0,
            "active:bg-slate-700 enabled:hover:bg-sky-600": files.length > 0,
          })}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? "Uploading" : "Upload Image"}
        </button>
      </div>
    </div>
  );
}
