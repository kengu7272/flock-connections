import { createFileRoute, redirect } from "@tanstack/react-router";

import { client } from "~/client/utils/trpc";

export const Route = createFileRoute("/_auth/flock/$flockId/create/")({
  beforeLoad: async ({ params: { flockId } }) => {
    const flock = await client.user.getFlock.query();
    if (!flock || flock.flock.name != flockId)
      throw redirect({ to: "/home", replace: true });
  },
});
