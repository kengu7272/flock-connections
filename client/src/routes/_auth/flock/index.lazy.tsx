import { createLazyFileRoute, Link } from "@tanstack/react-router";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/flock/")({
  component: Flock,
});

function Flock() {
  const { data: group } = trpc.user.getGroup.useQuery();

  return (
    <div className="flex w-full justify-center py-16">
      <main>
        {!group && (
          <div className="flex flex-col items-center gap-4 border-slate-600 p-4 border rounded-lg">
            <h3 className="font-bold text-2xl">You aren't part of a group</h3>
            <span>Create one or wait for an invite</span>
            <Link className="text-white rounded-md bg-sky-500 hover:bg-sky-600 active:bg-sky-700 px-3 py-2">Create a Group</Link>
          </div>
        )}
      </main>
    </div>
  );
}
