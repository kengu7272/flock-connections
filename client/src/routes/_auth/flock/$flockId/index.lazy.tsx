import { createLazyFileRoute } from "@tanstack/react-router";

import User from "~/client/src/components/User";

export const Route = createLazyFileRoute("/_auth/flock/$flockId/")({
  component: Flock,
});

function Flock() {
  const { flockId } = Route.useParams();
  const groupInfo = Route.useLoaderData();

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 px-4 py-6 lg:w-3/5 xl:w-2/5">
        <div className="flex items-center gap-3">
          <img
            className="h-16 w-16 rounded-full"
            src={groupInfo.groupInfo.picture}
          />
          <span className="text-2xl font-bold">{flockId}</span>
        </div>
        <p className="text-sm">{groupInfo.groupInfo.description}</p>
        <div className="mx-auto w-full space-y-2">
          <span className="px-2 text-lg">Members</span>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg bg-slate-600 p-2">
            {groupInfo.members.map((member) => (
              <User
                picture={member.user.picture}
                username={member.user.username}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
