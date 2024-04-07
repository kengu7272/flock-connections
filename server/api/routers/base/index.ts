import { publicProcedure, router } from "~/server/trpc";

export const baseRouter = router({
  loggedIn: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return { loggedIn: false };

    return {
      loggedIn: true,
      username: ctx.user.username,
      picture: ctx.user.picture,
    };
  }),
});
