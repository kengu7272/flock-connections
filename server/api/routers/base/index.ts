import { eq } from "drizzle-orm";
import { z } from "zod";

import { FlockMembers, Flocks, Users } from "~/server/db/src/schema";
import { protectedProcedure, publicProcedure, router } from "~/server/trpc";

export const baseRouter = router({
  loggedIn: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return { loggedIn: false };

    return {
      loggedIn: true,
      username: ctx.user.username,
      picture: ctx.user.picture,
    };
  }),
  userInfo: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      const [userInfo] = await ctx.db
        .select({
          user: {
            username: Users.username,
            picture: Users.picture,
            bio: Users.bio,
            joined: Users.joined,
            email: Users.email,
          },
          flock: {
            name: Flocks.name,
          },
        })
        .from(Users)
        .leftJoin(FlockMembers, eq(FlockMembers.userId, Users.id))
        .leftJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
        .where(eq(Users.username, input.username));

      return { userInfo, owner: userInfo.user.username === ctx.user?.username };
    }),
});
