import { useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/profile")({
  component: Profile,
});

function Profile() {
  const userInfo = trpc.user.userInfo.useQuery();
  const utils = trpc.useContext();

  const inputClass =
    "rounded-lg text-white px-2 py-1 bg-slate-800 h-12 flex-grow focus:outline-none";

  const [username, setUsername] = useState(userInfo.data?.username);
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      userInfo.refetch();
      utils.invalidate();
    },
  });

  return (
    <div className="w-full py-16">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 py-6 lg:w-3/5 xl:w-2/5">
        <span className="block w-full text-center text-xl">Edit Profile</span>
        <form
          className="mx-auto w-[90%] space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate({ username: username, });
          }}
        >
          <div className="flex flex-col gap-2">
            <label>Username</label>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder={userInfo.data?.username}
            />
          </div>
          <input
            type="submit"
            value="Update"
            disabled={!username?.length}
            className="rounded-lg block text-white bg-sky-600 ml-auto hover:bg-sky-700 h-12 active:bg-sky-800 px-3 py-2 disabled:opacity-75"
          />
        </form>
      </main>
    </div>
  );
}
