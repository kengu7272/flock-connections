import { eq } from "drizzle-orm";

import { GroupMembers, Groups } from "~/server/db/src/schema";
import { protectedProcedure, publicProcedure, router } from "~/server/trpc";

export const baseRouter = router({
  loggedIn: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return { loggedIn: false };

    return {
      loggedIn: true,
      username: ctx.user.username,
    };
  }),
  getGroup: protectedProcedure.query(async ({ ctx }) => {
    const [group] = await ctx.db
      .select({ group: { name: Groups.name }})
      .from(GroupMembers)
      .innerJoin(Groups, eq(Groups.id, GroupMembers.groupId))
      .where(eq(GroupMembers.userId, ctx.user.id));

    return group ?? null;
  }),
});
