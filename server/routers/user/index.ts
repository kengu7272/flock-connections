import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { GroupMembers, Groups, Users } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const userRouter = router({
  userInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(255).optional(),
        username: z.string().max(24).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.bio?.length && !input.username?.length) return;

      const set = {
        ...(input.username?.length ? { username: input.username } : {}),
        ...(input.bio?.length ? { bio: input.bio } : {}),
      };

      if (input.username?.length) {
        const existingUser = await ctx.db
          .select()
          .from(Users)
          .where(eq(Users.username, input.username));
        if (existingUser.length)
          throw new TRPCError({
            code: "CONFLICT",
            message: "Duplicate username",
          });
      }

      await ctx.db.update(Users).set(set).where(eq(Users.id, ctx.user.id));
    }),
  getGroup: protectedProcedure.query(async ({ ctx }) => {
    const [group] = await ctx.db
      .select({ group: { name: Groups.name } })
      .from(GroupMembers)
      .innerJoin(Groups, eq(Groups.id, GroupMembers.groupId))
      .where(eq(GroupMembers.userId, ctx.user.id));

    return group ?? null;
  }),
});