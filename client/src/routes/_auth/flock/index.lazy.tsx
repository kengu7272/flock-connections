import { createLazyFileRoute, Link } from "@tanstack/react-router";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/flock/")({
  component: Flock,
});

function Flock() {
  const data = trpc.user.getGroup.useQuery();

  return (
    <div className="flex w-full justify-center py-24">
      <main>
        {!data.isLoading && !data.data?.group && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-600 p-4">
            <h3 className="text-2xl font-bold">You aren't part of a Flock</h3>
            <span>Create one or wait for an invite</span>
            <Link to="/group" className="rounded-md font-semibold bg-sky-500 px-3 py-2 text-white hover:bg-sky-600 active:bg-sky-700">
              Create a Flock
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
