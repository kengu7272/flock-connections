import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useDropzone } from "@uploadthing/react/hooks";
import clsx from "clsx";
import { Check, FolderUp, Loader2, Menu, X, XCircle } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { generateClientDropzoneAccept } from "uploadthing/client";

import User from "~/client/src/components/User";
import { useUploadThing } from "~/client/src/utils/uploadthing";
import { trpc } from "~/client/utils/trpc";
import {
  MemberInviteSchema,
  MemberInviteSchemaType,
} from "~/server/validation";

export const Route = createLazyFileRoute("/_auth/flock/$flockId/")({
  component: Flock,
});

function Flock() {
  const navigate = useNavigate();
  const { flockId } = Route.useParams();
  const { groupInfo } = Route.useLoaderData();

  const { section: sectionParam } = Route.useSearch();
  if (!sectionParam)
    navigate({
      to: "/flock" + "/" + flockId,
      search: { section: "Members" },
      replace: true,
    });

  const sections = [
    {
      name: "Members",
      component: <Members name={flockId} />,
    },
    {
      name: "Voting",
      component: <Voting />,
    },
    {
      name: "Invites",
      component: <Invites />,
    },
  ];

  const [updatePicture, setUpdatePicture] = useState(false);
  const setPicture = useCallback(
    (value: boolean) => setUpdatePicture(value),
    [],
  );

  useEffect(() => {
    document.body.addEventListener("click", () => setPicture(false));
  }, []);

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 px-4 py-6 lg:w-3/5 xl:w-2/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              onClick={(e) => {
                e.stopPropagation();
                setUpdatePicture((prev) => !prev);
              }}
              className="h-16 w-16 rounded-full transition-transform hover:scale-110"
              src={groupInfo.picture}
            />
            {updatePicture && <ImageUpdater setImageStatus={setPicture} />}
          </div>
          <span className="text-2xl font-bold">{flockId}</span>
        </div>
        <p className="text-sm">{groupInfo.description}</p>
        <div>
          {sections.map((section) => (
            <button
              key={section.name}
              onClick={() =>
                navigate({
                  to: "/flock" + "/" + flockId,
                  search: { section: section.name },
                  replace: true,
                })
              }
              className={clsx({
                "px-2 text-lg hover:text-slate-100 active:text-slate-200": true,
                "font-semibold": sectionParam === section.name,
              })}
            >
              {section.name}
            </button>
          ))}
        </div>

        {sections.map(
          (section) =>
            sectionParam === section.name && (
              <div key={section.name}>{section.component}</div>
            ),
        )}
      </main>
    </div>
  );
}

const Members = ({ name }: { name: string }) => {
  const [selectedUser, setSelectedUser] = useState("");
  const { members, user } = Route.useLoaderData();

  const membersList = trpc.flock.getMembers.useQuery(
    { name },
    { initialData: members },
  );

  const createKick = trpc.flock.createKick.useMutation({
    onSuccess: () => {
      toast.success("Kick voting session successfully created");
    },
    onError: (e) => toast.error(e.message),
  });
  const createInvite = trpc.flock.createInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite voting session successfully created");
      membersList.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberInviteSchemaType>({
    resolver: zodResolver(MemberInviteSchema),
  });

  const onSubmit: SubmitHandler<MemberInviteSchemaType> = (data) => {
    createInvite.mutate({ username: data.username });
  };

  const navigate = useNavigate();
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const leaveFlock = trpc.user.leaveFlock.useMutation({
    onSuccess: () => {
      toast.success("Successfully left flock");
      navigate({ to: "/home" });
    },
  });

  useEffect(() => {
    document.body.addEventListener("click", () => {
      setSelectedUser("");
    });
  }, []);

  return (
    <div className="mx-auto w-full space-y-2">
      <form
        className="flex items-center gap-2 rounded-lg bg-slate-600 p-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex w-full flex-col">
          <input
            placeholder="Username"
            autoComplete="off"
            className="flex-grow rounded-lg bg-slate-600 p-2 text-white focus:bg-slate-700 focus:outline-none"
            {...register("username")}
          />
          {errors.username && (
            <span className="block text-sm text-red-500">
              {errors.username.message}
            </span>
          )}
        </div>
        <input
          type="submit"
          value="Invite User"
          className="ml-auto block rounded-lg bg-sky-500 px-2 py-3 hover:bg-sky-600 active:bg-sky-700"
        />
      </form>
      <div className="max-h-3/4 min-h-72 space-y-2 overflow-y-auto rounded-lg bg-slate-600 px-4 py-2">
        {membersList.data.map((member) => (
          <div
            key={member.user.username}
            className="flex items-center rounded-lg p-2 hover:bg-slate-700"
          >
            <User
              picture={member.user.picture}
              username={member.user.username}
            />
            <div className="relative ml-auto flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser((prev) =>
                    prev === member.user.username ? "" : member.user.username,
                  );
                }}
                className="hover:text-slate-100 active:text-slate-200"
              >
                <Menu />
              </button>
              {selectedUser === member.user.username && (
                <div className="absolute right-0 top-full z-50 min-w-24 whitespace-nowrap rounded-lg border border-slate-600 bg-slate-700 py-1">
                  {selectedUser !== user.username ? (
                    <button
                      onClick={() =>
                        createKick.mutate({ username: member.user.username })
                      }
                      className="w-full rounded-lg px-2 py-3 hover:bg-slate-800 active:bg-slate-900"
                    >
                      Vote to Kick
                    </button>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setLeaveConfirm((prev) => !prev)}
                        className="w-full rounded-lg px-2 py-3 hover:bg-red-700 active:bg-red-800"
                      >
                        Leave Flock
                      </button>
                      {leaveConfirm && (
                        <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-slate-800 p-2">
                          <span>Are you sure?</span>
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => leaveFlock.mutate()}>
                              <Check className="h-7 w-7 text-green-600 hover:text-green-700 active:text-green-800" />
                            </button>
                            <button
                              onClick={() => {
                                setLeaveConfirm(false);
                                setSelectedUser("");
                              }}
                            >
                              <X className="h-7 w-7 text-red-600 hover:text-red-700 active:text-red-800" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Voting = () => {
  const votes = trpc.flock.getVotes.useQuery();
  console.log(votes.data?.flockImageVotes);

  const castVote = trpc.flock.vote.useMutation({
    onSuccess: () => {
      toast.success("Successfully Voted");
      votes.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full space-y-2">
        <span>Member Actions</span>
        <div className="space-y-2 overflow-y-auto rounded-lg bg-slate-600 p-2">
          {votes.data?.memberVotes.length ? (
            votes.data.memberVotes.map((vote) => (
              <div
                key={vote.publicId}
                className="flex flex-col items-center gap-4 rounded-lg p-2 hover:bg-slate-700"
              >
                <div className="flex w-full flex-col justify-between gap-4 truncate lg:flex-row lg:gap-0">
                  <div className="text-center">
                    <span className="block font-semibold">Username</span>
                    <span>{vote.involving}</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-semibold">Action</span>
                    <span>{vote.type}</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-semibold">Creator</span>
                    <span>{vote.creator}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() =>
                        castVote.mutate({
                          vote: true,
                          publicId: vote.publicId,
                        })
                      }
                      className="rounded-lg bg-green-600 px-3 py-2 hover:bg-green-700 active:bg-green-800"
                    >
                      Yes
                    </button>
                    <span>({vote.yes})</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() =>
                        castVote.mutate({
                          vote: false,
                          publicId: vote.publicId,
                        })
                      }
                      className="rounded-lg bg-red-600 px-3 py-2 hover:bg-red-700 active:bg-red-800"
                    >
                      No
                    </button>
                    <span>({vote.no})</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <span>No active votes regarding members</span>
          )}
        </div>
      </div>
      <div className="mx-auto w-full space-y-2">
        <span>Flock Actions</span>
        <div className="space-y-2 overflow-y-auto rounded-lg bg-slate-600 p-2">
          {votes.data?.flockImageVotes.length ? (
            votes.data.flockImageVotes.map((vote) => (
              <div
                key={vote.publicId}
                className="flex flex-col items-center gap-4 rounded-lg p-2 hover:bg-slate-700"
              >
                <div className="text-center">
                  <span className="font-semibold">Action</span>
                </div>
              </div>
            ))
          ) : (
            <span>No active votes regarding the Flock</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Invites = () => {
  const { outstandingInvites } = Route.useLoaderData();

  return (
    <div className="mx-auto w-full space-y-2">
      <div className="max-h-3/4 min-h-72 space-y-2 overflow-y-auto rounded-lg bg-slate-600 px-4 py-2">
        {outstandingInvites.length ? (
          outstandingInvites.map((invite, index) => (
            <div
              key={invite.user}
              className="flex items-center gap-4 rounded-lg p-2 hover:bg-slate-700"
            >
              <span className="text-lg font-semibold">{index + 1}</span>
              <User picture={invite.picture} username={invite.user} />
            </div>
          ))
        ) : (
          <div>
            <span>No Outstanding Invites</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageUpdater = ({
  setImageStatus,
}: {
  setImageStatus: (value: boolean) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  }, []);

  const [progress, setProgress] = useState(0);
  const { startUpload, permittedFileInfo, isUploading } = useUploadThing(
    "flockImage",
    {
      onClientUploadComplete: () => {
        toast.success("Voting Session Created");
        setFiles([]);
        setImageStatus(false);
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
    maxFiles: 1,
  });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute left-0 top-full mt-4 w-72 space-y-4 rounded-lg border border-slate-600 bg-slate-800 p-4"
    >
      <span className="block whitespace-nowrap text-center">
        Suggest a New Image
      </span>
      <div className="flex w-full flex-col items-center justify-center gap-2 text-slate-50">
        <div
          className="relative flex h-32 w-full cursor-pointer items-center justify-center rounded-lg bg-slate-700"
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
        <div className="flex w-fit flex-col items-center justify-end gap-2">
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
            {isUploading ? "Uploading" : "Create Vote Session"}
          </button>
        </div>
      </div>
    </div>
  );
};
