import { useState } from "react";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Check, Menu, X } from "lucide-react";
import { toast } from "react-toastify";

import { trpc } from "~/client/utils/trpc";

export const Route = createLazyFileRoute("/_auth/home/")({
  component: Home,
});

function Home() {
  const flock = trpc.user.getFlock.useQuery();
  const invites = trpc.user.getOutstandingInvites.useQuery();

  const [selectedInvite, setSelectedInvite] = useState("");
  const acceptInvite = trpc.user.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Successfully joined Flock");
      invites.refetch();
      flock.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const declineInvite = trpc.user.declineInvite.useMutation({
    onSuccess: () => {
      toast.success("Successfully declined invite");
      invites.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div
      onClick={() => setSelectedInvite("")}
      className="flex w-full justify-center py-24"
    >
      <main>
        {!invites.isLoading && !!invites.data?.length && (
          <div className="my-2 flex max-h-96 min-h-40 flex-col items-center gap-4 overflow-y-auto rounded-lg border border-slate-600 p-2">
            <h3 className="text-2xl font-bold">Invites</h3>
            {invites.data.map((invites) => (
              <div
                className="relative flex w-full items-center justify-between rounded-lg bg-slate-600 px-2 py-3"
                key={invites.name}
              >
                <div>
                  <span>Invited by </span>
                  <span className="font-semibold">{invites.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedInvite(
                      selectedInvite === invites.name ? "" : invites.name,
                    );
                  }}
                >
                  <Menu />
                </button>
                {selectedInvite === invites.name && (
                  <div className="absolute right-0 top-full z-50 flex items-center rounded-lg bg-slate-700 p-2">
                    <button onClick={() => acceptInvite.mutate({ name: selectedInvite })} className="text-green-500 hover:text-green-600 active:text-green-700">
                      <Check className="h-7 w-7" />
                    </button>
                    <button onClick={() => declineInvite.mutate({ name: selectedInvite })} className="text-red-500 hover:text-red-600 active:text-red-700">
                      <X className="h-7 w-7" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!flock.isLoading && !flock.data?.flock && (
          <div className="my-2 flex flex-col items-center gap-4 rounded-lg border border-slate-600 p-4">
            <h3 className="text-2xl font-bold">
              You aren&apos;t part of a Flock
            </h3>
            <span>Create one or wait for an invite</span>
            <Link
              to="/flock"
              className="rounded-md bg-sky-500 px-3 py-2 font-semibold text-white hover:bg-sky-600 active:bg-sky-700"
            >
              Create a Flock
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
