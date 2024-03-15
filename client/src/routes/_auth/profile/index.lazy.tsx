import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/profile/")({
  component: Profile,
});

export const ProfileSchema = z.object({
  bio: z
    .string()
    .max(255)
    .refine((val) => !val.length || !!val.trim(), { message: "Empty Content" })
    .optional(),
  username: z
    .string()
    .max(16)
    .refine((val) => !val.includes(" "), { message: "Spaces aren't allowed" })
    .optional(),
});
type ProfileSchemaType = z.infer<typeof ProfileSchema>;

function Profile() {
  const userInfo = trpc.user.userInfo.useQuery();
  const flock = trpc.user.getFlock.useQuery();
  const utils = trpc.useContext();

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

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 py-6 lg:w-3/5 xl:w-2/5">
        <span className="block w-full text-center text-2xl font-bold">
          Edit Profile
        </span>
        <div className="flex flex-col items-center gap-2">
          <img
            src={userInfo.data?.picture ?? ""}
            className="h-16 w-16 rounded-full"
            alt="Profile Picture"
          />
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
      </main>
    </div>
  );
}
