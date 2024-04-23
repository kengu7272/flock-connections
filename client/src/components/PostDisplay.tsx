import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowLeftCircle, ArrowRightCircle, Heart } from "lucide-react";
import { DateTime } from "luxon";
import { toast } from "react-toastify";

import { trpc } from "~/client/utils/trpc";
import useInViewport from "../utils/useInViewport";

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
  const { isInViewport, ref } = useInViewport();
  if (isInViewport && !viewVar) {
    viewed.mutate({ postPublicId: publicId });
    setViewVar(true);
    ref(null);
  }

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
          <div className="mb-1 flex items-center gap-1">
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
        )}
        <span className="font-semibold">{flockId}</span>
        <p>{description}</p>
      </div>
    </div>
  );
}
