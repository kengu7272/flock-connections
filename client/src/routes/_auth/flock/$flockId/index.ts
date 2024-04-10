import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { client } from "~/client/utils/trpc";

const searchSchema = z.object({
  section: z.string().optional(),
});

export const Route = createFileRoute("/_auth/flock/$flockId/")({
  validateSearch: searchSchema,
  loader: async ({ params: { flockId } }) => {
    const userFlock = await client.user.getFlock.query();
    const members = await client.flock.getMembers.query({ name: flockId });
    const groupInfo = await client.flock.getInfo.query({ name: flockId });
    const user = await client.user.userInfo.query();
    const outstandingInvites = await client.flock.getOutstandingInvites.query();

    return {
      members,
      groupInfo,
      user,
      outstandingInvites,
      flockMember: userFlock?.flock.name === flockId,
    };
  },
});
