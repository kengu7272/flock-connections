import { useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/profile")({
  component: Profile,
});

function Profile() {
  const userInfo = trpc.user.userInfo.useQuery();
  const utils = trpc.useContext();

  const [bio, setBio] = useState(userInfo.data?.bio ?? "");
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      userInfo.refetch();
      utils.base.loggedIn.invalidate();
      toast.success("Updated Profile Successfully")
    },
    onError: () => {
      toast.error("Internal Server Error")
    }
  });

  return (
    <div className="w-full py-16">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 py-6 lg:w-3/5 xl:w-2/5">
        <span className="block w-full text-center text-xl font-bold">Edit Profile</span>
        <div className="flex flex-col items-center gap-1">
          <img
            src={userInfo.data?.picture ?? ""}
            className="h-16 w-16"
            alt="Profile Picture"
          />
          <span>{userInfo.data?.username}</span>
          <span>{userInfo.data?.email}</span>
          <span>Joined {userInfo.data?.joined.toDateString()}</span>
          <p className="text-sm text-slate-300">{userInfo.data?.bio}</p>
        </div>
        <form
          className="mx-auto w-[90%] space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate({ bio: bio });
          }}
        >
          <div className="flex flex-col gap-2">
            <label>Bio</label>
            <textarea
              className="rounded-lg text-white min-h-16 p-2 bg-slate-800 h-12 flex-grow focus:outline-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={userInfo.data?.bio ?? ""}
            />
          </div>
          <input
            type="submit"
            value="Update"
            disabled={!bio?.length}
            className="ml-auto block h-12 rounded-lg bg-sky-600 px-3 py-2 text-white hover:bg-sky-700 active:bg-sky-800 disabled:opacity-75"
          />
        </form>
      </main>
    </div>
  );
}
