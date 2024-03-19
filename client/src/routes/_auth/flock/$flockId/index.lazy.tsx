import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLazyFileRoute } from "@tanstack/react-router";
import { inferRouterOutputs } from "@trpc/server";
import clsx from "clsx";
import { Menu } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import User from "~/client/src/components/User";
import { trpc } from "~/client/utils/trpc";
import { AppRouter } from "~/server/routers/appRouter";
import { MemberInviteSchema, MemberInviteSchemaType } from "~/server/validation";

export const Route = createLazyFileRoute("/_auth/flock/$flockId/")({
  component: Flock,
});

function Flock() {
  const { flockId } = Route.useParams();
  const { groupInfo, members } = Route.useLoaderData();

  const sections = [
    {
      name: "Members",
      component: <Members name={flockId} members={members} />,
    },
    {
      name: "Voting",
      component: <Voting />,
    },
  ];

  const [selected, setSelected] = useState(sections[0].name);

  return (
    <div className="w-full py-24">
      <main className="items-center-center mx-auto flex w-[95%] flex-col space-y-4 rounded-lg bg-slate-700 px-4 py-6 lg:w-3/5 xl:w-2/5">
        <div className="flex items-center gap-3">
          <img className="h-16 w-16 rounded-full" src={groupInfo.picture} />
          <span className="text-2xl font-bold">{flockId}</span>
        </div>
        <p className="text-sm">{groupInfo.description}</p>
        <div>
          {sections.map((section) => (
            <button
              onClick={() => setSelected(section.name)}
              className={clsx({
                "px-2 text-lg hover:text-slate-100 active:text-slate-200": true,
                "font-semibold": selected === section.name,
              })}
            >
              {section.name}
            </button>
          ))}
        </div>

        {sections.map(
          (section) => selected === section.name && section.component,
        )}
      </main>
    </div>
  );
}

const Members = ({
  members,
  name,
}: {
  members: inferRouterOutputs<AppRouter>["flock"]["getMembers"];
  name: string;
}) => {
  const [selectedUser, setSelectedUser] = useState("");

  const membersList = trpc.flock.getMembers.useQuery(
    { name },
    { initialData: members },
  );

  const createKick = trpc.flock.createKick.useMutation({
    onSuccess: () => {
      toast.success("Kick voting session successfully created");
    },
    onError: (e) => toast.error(e.message),
  });

  const createInvite = trpc.flock.createInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite voting session successfully created");
      membersList.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberInviteSchemaType>({
    resolver: zodResolver(MemberInviteSchema),
  });

  const onSubmit: SubmitHandler<MemberInviteSchemaType> = (data) => {
    createInvite.mutate({ username: data.username });
  };

  return (
    <div className="mx-auto w-full space-y-2">
      <form
        className="flex items-center gap-2 rounded-lg bg-slate-600 p-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="w-full flex flex-col">
          <input
            placeholder="Username"
            autoComplete="off"
            className="flex-grow rounded-lg bg-slate-600 p-2 text-white focus:bg-slate-700 focus:outline-none"
            {...register("username")}
          />
          {errors.username && (
            <span className="text-sm text-red-500 block">
              {errors.username.message}
            </span>
          )}
        </div>
        <input
          type="submit"
          value="Invite User"
          className="ml-auto block rounded-lg bg-sky-500 px-2 py-3 hover:bg-sky-600 active:bg-sky-700"
        />
      </form>
      <div className="max-h-3/4 min-h-72 space-y-2 overflow-y-auto rounded-lg bg-slate-600 px-4 py-2">
        {membersList.data.map((member) => (
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

const Voting = () => {
  const votes = trpc.flock.getVotes.useQuery();

  const castMemberVote = trpc.flock.memberVote.useMutation({
    onSuccess: () => {
      toast.success("Successfully Voted");
      votes.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto w-full space-y-2">
      <span>Member Actions</span>
      <div className="max-h-3/4 space-y-2 overflow-y-auto rounded-lg bg-slate-600 p-2">
        {votes.data?.memberVotes.length ? (
          votes.data.memberVotes.map((vote) => (
            <div className="grid grid-cols-3 rounded-lg p-2 hover:bg-slate-700">
              <div>
                <span className="block font-semibold">Username</span>
                <span>{vote.involving}</span>
              </div>
              <div className="text-center">
                <span className="block font-semibold">Action</span>
                <span>{vote.type}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() =>
                      castMemberVote.mutate({
                        vote: true,
                        publicId: vote.publicId,
                      })
                    }
                    className="rounded-lg bg-green-600 px-3 py-2 hover:bg-green-700 active:bg-green-800"
                  >
                    Yes
                  </button>
                  <span>({vote.yes})</span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() =>
                      castMemberVote.mutate({
                        vote: false,
                        publicId: vote.publicId,
                      })
                    }
                    className="rounded-lg bg-red-600 px-3 py-2 hover:bg-red-700 active:bg-red-800"
                  >
                    No
                  </button>
                  <span>({vote.no})</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <span>No active votes regarding members</span>
        )}
      </div>
    </div>
  );
};
