import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { client } from "~/client/utils/trpc";

const searchSchema = z.object({
  section: z.string().optional(),
});

export const Route = createFileRoute("/_auth/flock/$flockId/")({
  validateSearch: searchSchema,
  beforeLoad: async ({ params: { flockId } }) => {
    const flock = await client.user.getFlock.query();
    if (!flock || flock.flock.name != flockId)
      throw redirect({ to: "/home", replace: true });
  },
  loader: async ({ params: { flockId } }) => {
    const members = await client.flock.getMembers.query({ name: flockId });
    const groupInfo = await client.flock.getInfo.query({ name: flockId });
    const user = await client.user.userInfo.query();

    return { members, groupInfo, user };
  },
});
