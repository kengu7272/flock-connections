import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDropzone } from "@uploadthing/react/hooks";
import clsx from "clsx";
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  Check,
  FolderUp,
  Loader2,
  Menu,
  X,
  XCircle,
} from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { z } from "zod";

import PostDisplay from "~/client/src/components/PostDisplay";
import User from "~/client/src/components/User";
import { inputClass } from "~/client/src/utils/classes";
import { useUploadThing } from "~/client/src/utils/uploadthing";
import useOnScreen from "~/client/src/utils/useOnScreen";
import { trpc } from "~/client/utils/trpc";
import {
  FlockSchema,
  MemberInviteSchema,
  MemberInviteSchemaType,
} from "~/server/validation";

export const Route = createLazyFileRoute("/_auth/flock/$flockId/")({
  component: Flock,
});

const FlockDescriptionSchema = FlockSchema.pick({ description: true });
type FlockDescriptionType = z.infer<typeof FlockDescriptionSchema>;

function Flock() {
  const navigate = useNavigate();
  const { flockId } = Route.useParams();
  const { groupInfo: initialGroupInfo, flockMember } = Route.useLoaderData();
  const groupInfo = trpc.flock.getInfo.useQuery(
    { name: flockId },
    { initialData: initialGroupInfo },
  );

  const { section: sectionParam } = Route.useSearch();
  if (!sectionParam)
    navigate({
      to: "/flock" + "/" + flockId,
      search: { section: "Posts" },
      replace: true,
    });

  let sections = [
    {
      name: "Posts",
      component: <Posts />,
    },
    {
      name: "Members",
      component: <Members />,
    },
  ];

  if (flockMember) {
    sections = sections.concat([
      {
        name: "Voting",
        component: <Voting />,
      },
      {
        name: "Invites",
        component: <Invites />,
      },
    ]);
  }

  const [update, setUpdate] = useState("");
  const setPicture = useCallback((value: string) => setUpdate(value), []);

  useEffect(() => {
    document.body.addEventListener("click", () => {
      setPicture("");
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FlockDescriptionType>({
    resolver: zodResolver(FlockSchema.pick({ description: true })),
  });

  const createDescriptionSession =
    trpc.flock.createUpdateDescription.useMutation({
      onSuccess: () => {
        toast.success("Successfully Created Session");
        groupInfo.refetch();
        setUpdate("");
      },
      onError: (e) => toast.error(e.message),
    });

  const onSubmit: SubmitHandler<FlockDescriptionType> = ({ description }) => {
    createDescriptionSession.mutate({ description });
  };

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 px-1 py-6 lg:w-3/5 lg:px-4 xl:w-2/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              onClick={(e) => {
                e.stopPropagation();
                setUpdate((prev) => (prev === "image" ? "" : "image"));
              }}
              className="h-16 w-16 rounded-full transition-transform hover:scale-110"
              src={groupInfo.data.picture}
            />
            {update === "image" && <ImageUpdater setImageStatus={setPicture} />}
          </div>
          <span className="text-2xl font-bold">{flockId}</span>
        </div>
        <div className="relative">
          <p
            onClick={(e) => {
              e.stopPropagation();
              setUpdate((prev) =>
                prev === "description" ? "" : "description",
              );
            }}
            className="w-fit text-sm hover:cursor-default hover:text-gray-300"
          >
            {groupInfo.data.description}
          </p>
          {update === "description" && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-full z-50 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 p-2"
            >
              <form
                className="space-y-5 px-4 py-2"
                onSubmit={handleSubmit(onSubmit)}
              >
                <h1 className="text-center text-3xl font-bold">
                  Update Description
                </h1>
                <div className="flex flex-col gap-2">
                  <label>Description</label>
                  <textarea
                    className={inputClass + " min-h-32"}
                    placeholder="Tell everyone a little about your flock (Max 500)"
                    {...register("description")}
                  />
                  {errors.description && (
                    <span className="text-sm text-red-500">
                      {errors.description.message}
                    </span>
                  )}
                </div>
                <input
                  type="submit"
                  value="Create Session"
                  className="ml-auto block rounded-lg bg-sky-500 px-2 py-3 hover:bg-sky-600 active:bg-sky-700"
                />
              </form>
            </div>
          )}
        </div>
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

const Members = () => {
  const { flockId: name } = Route.useParams();
  const [selectedUser, setSelectedUser] = useState("");
  const { members, user, flockMember } = Route.useLoaderData();

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
      {flockMember && (
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
            className="ml-auto block rounded-lg bg-sky-500 px-2 py-3 font-semibold hover:bg-sky-600 active:bg-sky-700"
          />
        </form>
      )}
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
              {flockMember && (
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
              )}
              {selectedUser === member.user.username && (
                <div className="absolute right-0 top-full z-50 min-w-24 whitespace-nowrap rounded-lg border border-slate-600 bg-slate-700 py-1">
                  {selectedUser !== user.username ? (
                    <button
                      onClick={() =>
                        createKick.mutate({ username: member.user.username })
                      }
                      className="w-full font-semibold rounded-lg px-2 py-3 hover:bg-slate-800 active:bg-slate-900"
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
  const { flockId } = Route.useParams();
  const utils = trpc.useContext();

  const castVote = trpc.flock.vote.useMutation({
    onSuccess: (res) => {
      toast.success(
        res?.consensus
          ? `Voting finished, consensus is ${res.consensus}`
          : "Successfully Voted",
      );
      votes.refetch();
      !!res && utils.flock.getInfo.refetch();
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
                className="flex flex-col items-center gap-4 rounded-lg bg-slate-700 px-2 py-4"
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
                      className="rounded-lg font-semibold bg-green-600 px-3 py-2 hover:bg-green-700 active:bg-green-800"
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
                      className="rounded-lg font-semibold bg-red-600 px-3 py-2 hover:bg-red-700 active:bg-red-800"
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
          {votes.data?.flockDetailsVotes.length ? (
            votes.data.flockDetailsVotes.map((vote) => {
              if (vote.type === "UPDATE PICTURE") {
                const [imageUrl] = vote.imageUrl!;
                return (
                  <div
                    key={vote.publicId}
                    className="flex flex-col items-center gap-4 rounded-lg bg-slate-700 px-2 py-4"
                  >
                    <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-0">
                      <div className="mx-auto text-center">
                        <span className="block font-semibold">Action</span>
                        <span>Update Image</span>
                      </div>
                      <img
                        className="mx-auto h-24 w-24 rounded-full transition-transform hover:scale-110"
                        src={imageUrl}
                      />
                      <div className="mx-auto text-center">
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
                          className="rounded-lg font-semibold bg-green-600 px-3 py-2 hover:bg-green-700 active:bg-green-800"
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
                          className="rounded-lg font-semibold bg-red-600 px-3 py-2 hover:bg-red-700 active:bg-red-800"
                        >
                          No
                        </button>
                        <span>({vote.no})</span>
                      </div>
                    </div>
                  </div>
                );
              } else if (vote.type === "UPDATE DESCRIPTION")
                return (
                  <div
                    key={vote.publicId}
                    className="flex flex-col items-center gap-4 rounded-lg bg-slate-700 px-2 py-4"
                  >
                    <div className="flex w-full flex-col items-center justify-center gap-y-4 lg:flex-row lg:gap-0">
                      <div className="text-center">
                        <span className="block font-semibold">Action</span>
                        <span>Update Description</span>
                      </div>
                      <div className="text-center">
                        <span className="block font-semibold">Creator</span>
                        <span>{vote.creator}</span>
                      </div>
                    </div>
                    <div className="w-full">
                      <span className="font-semibold">Change To: </span>
                      <p className="inline">{vote.description}</p>
                    </div>
                    <div className="mx-auto flex items-center justify-end gap-2">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() =>
                            castVote.mutate({
                              vote: true,
                              publicId: vote.publicId,
                            })
                          }
                          className="rounded-lg font-semibold bg-green-600 px-3 py-2 hover:bg-green-700 active:bg-green-800"
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
                          className="rounded-lg font-semibold bg-red-600 px-3 py-2 hover:bg-red-700 active:bg-red-800"
                        >
                          No
                        </button>
                        <span>({vote.no})</span>
                      </div>
                    </div>
                  </div>
                );
              else if (
                vote.type === "CREATE POST" ||
                vote.type === "DELETE POST"
              ) {
                return (
                  <div
                    key={vote.publicId}
                    className="flex flex-col items-center gap-4 rounded-lg bg-slate-700 px-2 py-4"
                  >
                    <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:justify-center lg:gap-0">
                      <div className="mx-auto text-center">
                        <span className="block font-semibold">Action</span>
                        <span>
                          {vote.type === "CREATE POST" ? "Create " : "Delete "}
                          Post
                        </span>
                      </div>
                      <div className="mx-auto text-center">
                        <span className="block font-semibold">Creator</span>
                        <span>{vote.creator}</span>
                      </div>
                    </div>
                    <PostVote
                      images={vote.imageUrl!}
                      description={vote.description ?? ""}
                      flockId={flockId}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() =>
                            castVote.mutate({
                              vote: true,
                              publicId: vote.publicId,
                            })
                          }
                          className="rounded-lg font-semibold bg-green-600 px-3 py-2 hover:bg-green-700 active:bg-green-800"
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
                          className="rounded-lg font-semibold bg-red-600 px-3 py-2 hover:bg-red-700 active:bg-red-800"
                        >
                          No
                        </button>
                        <span>({vote.no})</span>
                      </div>
                    </div>
                  </div>
                );
              }
            })
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
  setImageStatus: (value: string) => void;
}) => {
  const utils = trpc.useContext();

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
        setImageStatus("");
        utils.flock.getVotes.refetch();
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
      className="absolute left-0 top-full z-50 mt-4 w-72 space-y-4 rounded-lg border border-slate-600 bg-slate-800 p-4"
    >
      <h1 className="text-center text-3xl font-bold">Update Image</h1>
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

function Posts() {
  const { flockMember } = Route.useLoaderData();
  const { flockId: flock } = Route.useParams();

  const posts = trpc.flock.getPosts.useInfiniteQuery(
    { name: flock },
    { getNextPageParam: (prev) => prev.nextCursor },
  );
  const { ref, isInViewport: lastPostVisible } = useOnScreen();
  if (lastPostVisible && posts.hasNextPage && !posts.isLoading)
    posts.fetchNextPage();

  return (
    <div className="mx-auto w-full space-y-2">
      <div className="max-h-3/4 min-h-72 space-y-2 overflow-y-auto rounded-lg bg-slate-600 px-1 py-2 lg:px-4">
        {flockMember && (
          <Link
            className="mx-auto block rounded-lg bg-sky-500 px-8 py-4 text-center text-xl font-semibold hover:bg-sky-600 active:bg-sky-700"
            to={"/flock/" + flock + "/create"}
          >
            Create Post
          </Link>
        )}
        {!!posts.data?.pages[0].posts[0] && (
          <div className="space-y-2 rounded-lg bg-slate-800 p-2">
            {!posts.isLoading &&
              posts.data?.pages.map((page, pageIndex) =>
                page.posts.map((post, postIndex) => (
                  <div
                    key={post.publicId}
                    {...(pageIndex === posts.data.pages.length - 1 &&
                    postIndex === page.posts.length - 1
                      ? { ref }
                      : {})}
                  >
                    <PostDisplay
                      date={post.createdAt}
                      images={post.picture}
                      description={post.description}
                      key={post.publicId}
                      likes={post.likes}
                      publicId={post.publicId}
                      flockId={flock}
                      inFlock={flockMember}
                    />
                  </div>
                )),
              )}
          </div>
        )}
        {posts.isLoading && (
          <span className="block w-full text-center">Loading...</span>
        )}
      </div>
    </div>
  );
}

function PostVote({
  images,
  description,
  flockId,
}: {
  images: string[];
  description: string | null;
  flockId: string;
}) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="max-h-[600px] w-full space-y-3 rounded-lg bg-slate-700 py-2 text-sm">
      <div>
        <div className="relative">
          {images.map(
            (image, index) =>
              current === index && (
                <img
                  key={image}
                  className="mx-auto h-[420px] rounded-lg object-contain"
                  src={images[current]}
                />
              ),
          )}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 transform hover:text-white active:text-gray-200 disabled:opacity-50"
                onClick={() => setCurrent((prev) => Math.max(0, prev - 1))}
                disabled={current === 0}
              >
                <ArrowLeftCircle />
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 transform hover:text-white active:text-gray-200 disabled:opacity-50"
                disabled={current === images.length - 1}
                onClick={() =>
                  setCurrent((prev) => Math.min(images.length - 1, prev + 1))
                }
              >
                <ArrowRightCircle />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="max-h-28 overflow-y-auto px-2">
        <span className="font-semibold">{flockId}</span>
        <p>{description}</p>
      </div>
    </div>
  );
}
