import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  Heart,
  MessageSquareText,
} from "lucide-react";
import { DateTime } from "luxon";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { trpc } from "~/client/utils/trpc";
import { PostCommentSchema, PostCommentSchemaType } from "~/server/validation";
import useInViewport from "../utils/useInViewport";
import User from "./User";

export default function PostDisplay({
  images,
  description,
  date,
  likes,
  publicId,
  flockId,
  userLiked,
  userViewed,
  inFlock,
}: {
  images: string[];
  description: string | null;
  date: Date;
  likes: number;
  publicId: string;
  flockId: string;
  userLiked?: boolean;
  userViewed?: boolean;
  inFlock?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [postLikes, setPostLikes] = useState(likes);
  const [heartColor, setHeartColor] = useState(userLiked);
  const toggleLike = trpc.post.like.useMutation({
    onSuccess: (res) => {
      toast.success("Successfully " + res);
      res === "Liked"
        ? setPostLikes((prev) => prev + 1)
        : setPostLikes((prev) => prev - 1);
      userLiked !== undefined && setHeartColor((prev) => !prev);
    },
    onError: (e) => toast.error(e.message),
  });

  const utils = trpc.useContext();
  const [deletePrompt, setDeletePrompt] = useState(false);
  const deletePost = trpc.flock.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Successfully Created Session");
      utils.flock.getPosts.invalidate();
      setDeletePrompt(false);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    document.body.addEventListener("click", () => {
      setDeletePrompt(false);
    });
  }, []);

  const viewed = trpc.post.view.useMutation();
  const [viewVar, setViewVar] = useState(!!userViewed);
  const { isInViewport: postInViewport, ref } = useInViewport();
  if (postInViewport && !viewVar) {
    viewed.mutate({ postPublicId: publicId });
    setViewVar(true);
    ref(null);
  }

  const [openComment, setOpenComment] = useState(false);
  const comments = trpc.post.getComments.useInfiniteQuery(
    { postPublicId: publicId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: openComment,
    },
  );
  const comment = trpc.post.comment.useMutation({
    onSuccess: () => {
      toast.success("Successfully Commented");
      comments.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const { isInViewport: lastComment, ref: commentRef } = useInViewport();
  if (lastComment && comments.hasNextPage && !comments.isLoading)
    comments.fetchNextPage();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostCommentSchemaType>({
    resolver: zodResolver(PostCommentSchema),
  });
  const onSubmit: SubmitHandler<PostCommentSchemaType> = (data) => {
    comment.mutate({ postPublicId: publicId, comment: data.comment });
  };

  return (
    <div
      ref={!viewVar ? ref : undefined}
      className="w-full space-y-3 rounded-lg bg-slate-700 py-2 text-sm"
    >
      <div>
        {inFlock && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto w-fit"
          >
            <button
              onClick={() => setDeletePrompt((prev) => !prev)}
              className="rounded-lg bg-red-500 px-3 py-2 font-semibold hover:bg-red-600 active:bg-red-700"
            >
              Delete
            </button>
            {deletePrompt && (
              <div className="absolute right-1/2 top-full z-10 mt-2 translate-x-1/2 space-y-2 rounded-lg bg-slate-800 p-2">
                <span className="block text-center">Are you sure?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deletePost.mutate({ publicId })}
                    className="rounded-lg bg-sky-500 px-3 py-2 font-semibold hover:bg-sky-600 active:bg-sky-700"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeletePrompt(false)}
                    className="rounded-lg bg-red-500 px-3 py-2 font-semibold hover:bg-red-600 active:bg-red-700"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {date && (
          <span className="mx-auto my-2 block w-fit font-semibold">
            {DateTime.fromJSDate(date).toLocaleString()}
          </span>
        )}
        <div className="relative">
          {images.map(
            (image, index) =>
              current === index && (
                <img
                  key={image}
                  className="mx-auto h-[250px] rounded-lg object-contain md:h-[400px] lg:h-[500px]"
                  src={images[current]}
                  loading="lazy"
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
      <div className="px-2">
        {likes !== undefined && !!publicId && (
          <div className="mb-1 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleLike.mutate({ postPublicId: publicId })}
                className="block hover:text-sky-600 active:text-sky-700"
              >
                <Heart
                  className={clsx({
                    "h-5 w-5": true,
                    "text-sky-700": heartColor && userLiked !== undefined,
                  })}
                />
              </button>
              <span className="text-lg font-semibold">{postLikes}</span>
            </div>
            <button
              onClick={() => setOpenComment((prev) => !prev)}
              className="block hover:text-sky-600 active:text-sky-700"
            >
              <MessageSquareText className="h-5 w-5" />
            </button>
          </div>
        )}
        <span className="font-semibold">{flockId}</span>
        <p>{description}</p>
      </div>
      {openComment && (
        <div className="space-y-2 bg-slate-800 p-2">
          <span>Comments</span>
          {comments.data?.pages.length && (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {comments.data.pages.map((page, pageIndex) =>
                page.comments.map((comment, commentIndex) => (
                  <div
                    key={comment.comment.id}
                    className="flex flex-col space-y-2 rounded-lg bg-slate-700 p-2"
                    {...(pageIndex === comments.data.pages.length - 1 &&
                    commentIndex === page.comments.length - 1
                      ? { ref: commentRef }
                      : {})}
                  >
                    <User
                      picture={comment.user.picture}
                      username={comment.user.username}
                    />
                    <p>{comment.comment.text}</p>
                  </div>
                )),
              )}
            </div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full items-center gap-2"
          >
            <div className="relative w-full">
              <textarea
                placeholder="Comment"
                className="max-h-40 w-full rounded-lg bg-slate-600 p-2 text-white focus:outline-none"
                {...register("comment")}
              />
              {errors.comment && (
                <span className="absolute left-2 top-full text-sm text-red-500">
                  {errors.comment.message}
                </span>
              )}
            </div>
            <button className="h-fit rounded-md bg-sky-600 px-4 py-3 font-semibold hover:bg-sky-700 active:bg-sky-800">
              Comment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
