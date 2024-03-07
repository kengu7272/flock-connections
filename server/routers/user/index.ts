import { eq } from "drizzle-orm";
import { z } from "zod";

import { Users } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const userRouter = router({
  userInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(z.object({ bio: z.string().max(255).optional(), username: z.string().max(24).optional() }))
    .mutation(async ({ ctx, input }) => {
      if(!input.bio?.length && !input.username?.length)
        return;

      const set = {
        ...(input.username ? { username: input.username } : {}),
        ...(input.bio ? { bio: input.bio } : {}),
      }
  
      console.log(input);
      await ctx.db
        .update(Users)
        .set(set)
        .where(eq(Users.id, ctx.user.id));
    }),
});
