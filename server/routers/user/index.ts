import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { FlockMembers, Flocks, Users } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";
import { ProfileSchema } from "~/server/validation";

export const userRouter = router({
  userInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(ProfileSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.bio?.length && !input.username?.length)
        throw new TRPCError({ code: "BAD_REQUEST", message: "No Content" });

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
  getFlock: protectedProcedure.query(async ({ ctx }) => {
    const [flock] = await ctx.db
      .select({ flock: { name: Flocks.name } })
      .from(FlockMembers)
      .innerJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
      .where(eq(FlockMembers.userId, ctx.user.id));

    return flock ?? null;
  }),
  clearBio: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(Users)
      .set({ bio: "" })
      .where(eq(Users.id, ctx.user.id));
  }),
});
