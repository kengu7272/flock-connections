import { useState } from "react";
import { ArrowLeftCircle, ArrowRightCircle, Heart } from "lucide-react";
import { DateTime } from "luxon";
import { toast } from "react-toastify";

import { trpc } from "~/client/utils/trpc";

export default function PostDisplay({
  images,
  description,
  date,
  likes,
  publicId,
  flockId,
}: {
  images: string[];
  description: string | null;
  date: Date;
  likes: number;
  publicId: string;
  flockId: string;
}) {
  const [current, setCurrent] = useState(0);
  const [postLikes, setPostLikes] = useState(likes);
  const toggleLike = trpc.post.like.useMutation({
    onSuccess: (res) => {
      toast.success("Successfully " + res);
      res === "Liked"
        ? setPostLikes((prev) => prev + 1)
        : setPostLikes((prev) => prev - 1);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="w-full space-y-3 rounded-lg bg-slate-700 py-2 text-sm">
      <div>
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
      <div className="px-2">
        {likes !== undefined && !!publicId && (
          <div className="mb-1 flex items-center gap-1">
            <button
              onClick={() => toggleLike.mutate({ postPublicId: publicId })}
              className="block hover:text-sky-600 active:text-sky-700"
            >
              <Heart className="h-5 w-5" />
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
