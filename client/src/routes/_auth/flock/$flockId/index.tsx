import { createFileRoute, redirect } from "@tanstack/react-router";

import { client } from "~/client/utils/trpc";

export const Route = createFileRoute("/_auth/flock/$flockId/")({
  beforeLoad: async ({ params: { flockId } }) => {
    const flock = await client.user.getFlock.query();
    if (!flock || flock.flock.name != flockId) throw redirect({ to: "/home", replace: true });
  },
  loader: async ({ params: { flockId } }) => {
    const members = await client.flock.getMembers.query({ name: flockId });
    const groupInfo = await client.flock.getInfo.query({ name: flockId });

    return { members, groupInfo };
  },
});
