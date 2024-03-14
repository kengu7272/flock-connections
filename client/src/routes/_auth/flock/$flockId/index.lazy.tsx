import { useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { inferRouterOutputs } from "@trpc/server";
import clsx from "clsx";
import { Menu } from "lucide-react";
import { toast } from "react-toastify";

import User from "~/client/src/components/User";
import { trpc } from "~/client/utils/trpc";
import { AppRouter } from "~/server/routers/appRouter";

export const Route = createLazyFileRoute("/_auth/flock/$flockId/")({
  component: Flock,
});

function Flock() {
  const { flockId } = Route.useParams();
  const { groupInfo, members } = Route.useLoaderData();

  const [selected, setSelected] = useState("Members");

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 px-4 py-6 lg:w-3/5 xl:w-2/5">
        <div className="flex items-center gap-3">
          <img className="h-16 w-16 rounded-full" src={groupInfo.picture} />
          <span className="text-2xl font-bold">{flockId}</span>
        </div>
        <div>
          <button
            onClick={() => setSelected("Members")}
            className={clsx({
              "px-2 text-lg hover:text-slate-100 active:text-slate-200": true,
              "font-semibold": selected === "Members",
            })}
          >
            Members
          </button>
        </div>
        <p className="text-sm">{groupInfo.description}</p>
        {selected === "Members" && <Members members={members} />}
      </main>
    </div>
  );
}

const Members = ({
  members,
}: {
  members: inferRouterOutputs<AppRouter>["flock"]["getMembers"];
}) => {
  const [selectedUser, setSelectedUser] = useState("");

  const createKick = trpc.flock.createKick.useMutation({
    onSuccess: () => {
      toast.success("Kick voting session successfully created");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="mx-auto w-full space-y-2">
      <div className="max-h-3/4 space-y-2 overflow-y-auto rounded-lg bg-slate-600 px-4 py-2">
        {members.map((member) => (
          <div key={member.user.username} className="flex items-center">
            <User
              picture={member.user.picture}
              username={member.user.username}
            />
            <div className="relative ml-auto">
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
                <div className="absolute right-0 top-full z-50 min-w-24 whitespace-nowrap rounded-lg bg-slate-700 py-1">
                  <button
                    onClick={() =>
                      createKick.mutate({ username: member.user.username })
                    }
                    className="w-full rounded-lg px-2 py-3 hover:bg-slate-800 active:bg-slate-900"
                  >
                    Vote to Kick
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
