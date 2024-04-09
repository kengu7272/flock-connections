import { createFileRoute, redirect } from "@tanstack/react-router";

import { client } from "~/client/utils/trpc";

export const Route = createFileRoute("/_auth/profile/$profileId/")({
  loader: async ({ params: { profileId } }) => {
    const { userInfo, owner } = await client.base.userInfo.query({
      username: profileId,
    });
    if (!userInfo) throw redirect({ to: "/", replace: true });

    return { userInfo, owner, profileId };
  },
});
